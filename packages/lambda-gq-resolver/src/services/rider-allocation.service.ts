/* eslint-disable no-restricted-syntax */
import { commonConfig } from '@alpaca-backend/common';
import _ from 'lodash';
import RiderAllocation from 'src/domain/models/rider-allocation';
import RiderAllocationRepository from 'src/repositories/rider-allocation.respository';
import { Service } from 'typedi';

import RiderRank from 'src/domain/objects/rider-rank';
import DataLoader from 'dataloader';
import CreatableService from './creatable.service';

export interface RiderAllocationKey {
  heatId: string;
  userId: string;
}

export interface RiderAllocationPosition {
  position: number | null;
  order: number;
  startOrder: number;
}

// this service will be global - shared by every request
@Service()
@Service({ id: RiderAllocation })
export class RiderAllocationService extends CreatableService<RiderAllocation> {
  riderAllocationPositionDataLoader: DataLoader<RiderAllocationKey, RiderAllocationPosition>;

  constructor(protected readonly repository: RiderAllocationRepository) {
    super();

    const cacheKeyFn = ({ heatId, userId }) => `${heatId}-${userId}`;

    this.riderAllocationPositionDataLoader = new DataLoader(
      async (keys: RiderAllocationKey[]) => {
        const uniqueKeys = _.uniqWith(keys, _.isEqual);
        const allRiderAllocations = await this.batchGet(uniqueKeys);

        const groupedRiderAlocations = _.groupBy(allRiderAllocations, (ra) => ra.heatId);

        const positionMap: { [key: string]: RiderAllocationPosition } = {};

        Object.keys(groupedRiderAlocations).forEach((headId, i) => {
          const heatRAs = groupedRiderAlocations[headId] as RiderAllocation[];

          const startOrderLookup: Map<number, number> = new Map();

          // Should actually be reversed
          _.orderBy(heatRAs, ({ startSeed }) => startSeed, 'desc').forEach(({ startSeed }, i) => {
            startOrderLookup.set(startSeed, i + 1);
          });

          const orderMap: Map<number, RiderAllocation[]> = new Map();

          const orderedRAs = _.orderBy(heatRAs, [(ra) => ra.getBestScore(), (ra) => ra.startSeed], ['desc', 'asc']);
          orderedRAs.forEach((ra) => {
            const bestScore = ra.getBestScore();
            const currList = orderMap.get(bestScore) || [];
            orderMap.set(bestScore, _.concat(currList, ra));
          });

          let posCounter = 1;
          let orderCounter = 1;
          for (const [bestScore, riderAllocations] of orderMap.entries()) {
            for (const ra of riderAllocations) {
              const raPosition = {
                position: bestScore > -1 ? posCounter : null,
                order: orderCounter,
                startOrder: startOrderLookup.get(ra.startSeed),
              };
              positionMap[cacheKeyFn(ra.getKeys())] = raPosition;
              orderCounter++;
            }
            posCounter++;
          }
        });

        return keys.map((key) => positionMap[cacheKeyFn(key)]);
      },
      { cache: true, cacheKeyFn }
    );
  }

  public async getRiderAllocationsByHeatId(heatId: string): Promise<RiderAllocation[]> {
    return this.repository.query().index(commonConfig.DB_SCHEMA.RiderAllocation.indexes.byHeat.indexName).wherePartitionKey(heatId).execFetchAll();
  }

  public async getRiderAllocationsPreviousHeatId(previousHeatId: string): Promise<RiderAllocation[]> {
    return this.repository.scan().whereAttribute('previousHeatId').eq(previousHeatId).execFetchAll();
  }

  public async rankHeats(heatIds: string[]): Promise<RiderRank[]> {
    const rankedRiders = await Promise.all(heatIds.map((id) => this.getRiderAllocationsByHeatId(id)));
    const riderRankList = [] as RiderRank[];
    let runOrder = 1;
    rankedRiders.forEach((listOfRiders) => {
      _.orderBy(listOfRiders, (ra) => ra.startSeed, 'desc').forEach((ra) => {
        const riderRank = new RiderRank();
        riderRank.userId = ra.userId;
        riderRank.rank = runOrder;
        riderRankList.push(riderRank);
        runOrder++;
      });
    });
    return riderRankList;
  }

  public async getSortedRiderAllocationsByHeatId(heatId: string): Promise<RiderAllocation[]> {
    let riderAllocations = await this.getRiderAllocationsByHeatId(heatId);

    const orderMap: Map<RiderAllocation, number> = new Map();

    const getOrder = async (riderAllocation: RiderAllocation): Promise<void> => {
      const result = await this.riderAllocationPositionDataLoader.load({ heatId: riderAllocation.heatId, userId: riderAllocation.userId });
      orderMap.set(riderAllocation, result.order);
    };

    await Promise.all(riderAllocations.map((riderAllocation) => getOrder(riderAllocation)));

    riderAllocations = _.orderBy(riderAllocations, (riderAllocation) => orderMap.get(riderAllocation));

    return riderAllocations;
  }

  async getPosition(riderAllocation: RiderAllocation): Promise<number | null> {
    const result = await this.riderAllocationPositionDataLoader.load({ heatId: riderAllocation.heatId, userId: riderAllocation.userId });
    return result.position;
  }

  async getRankOrder(riderAllocation: RiderAllocation): Promise<number | null> {
    const result = await this.riderAllocationPositionDataLoader.load({ heatId: riderAllocation.heatId, userId: riderAllocation.userId });
    return result.order;
  }

  async getStartOrder(riderAllocation: RiderAllocation): Promise<number | null> {
    const result = await this.riderAllocationPositionDataLoader.load({ heatId: riderAllocation.heatId, userId: riderAllocation.userId });
    return result.startOrder;
  }
}
