/* eslint-disable class-methods-use-this */
import { Inject, Service } from 'typedi';

import Competition from 'src/domain/models/competition';
import CompetitionRepository from 'src/repositories/competition.respository';
import { commonConfig } from '@alpaca-backend/common';
import Context, { IContext } from 'src/typegraphql-setup/context';
import Link, { LinkType } from 'src/domain/objects/link';
import Creatable from 'src/domain/interfaces/creatable';
import { RiderRankList } from 'src/domain/objects/lists';
import DataLoader from 'dataloader';
import RiderAllocation from 'src/domain/models/rider-allocation';
import _ from 'lodash';
import RiderRank from 'src/domain/objects/rider-rank';
import Heat, { HeatStatus } from 'src/domain/models/heat';
import Schedule from 'src/domain/interfaces/schedule';
import ScheduleItem from 'src/domain/models/schedule-item';
import CreatableService from './creatable.service';
import { DataEntityService } from './data-entity.service';
import { EventService } from './event.service';
import { HeatService, RiderAllocationService, RiderRegistrationService, RoundService, ScheduleItemService, UserService } from '.';
import { ScheduleService } from './schedule.service';

interface RiderRanking {
  competitionId: string;
  rankedRiders: RiderRankList;
  unrankedRiders: RiderRankList;
}

export type RiderRankingDataLoader = DataLoader<string, RiderRanking>;

@Service()
@Service({ id: Competition })
export class CompetitionService extends CreatableService<Competition> implements DataEntityService, ScheduleService {
  riderRankingDataLoader: RiderRankingDataLoader;

  constructor(protected readonly repository: CompetitionRepository) {
    super();
  }

  private initDataLoader(): void {
    if (this.riderRankingDataLoader) {
      // already initialized
      return;
    }
    const roundService = this.context.getService(RoundService);
    const competitionService = this.context.getService(CompetitionService);
    const riderRegistationService = this.context.getService(RiderRegistrationService);
    const heatService = this.context.getService(HeatService);
    const riderAllocationService = this.context.getService(RiderAllocationService);
    const userService = this.context.getService(UserService);

    const getRiderRankingFromHeats = async (competition: Competition) => {
      const timeA = new Date().getTime();
      const rounds = _.orderBy(await roundService.getRoundsByCompetitionId(competition.id), ({ roundNo, type }) => [roundNo, type], ['desc', 'desc']);
      const unrankedRidersAllocations: RiderAllocation[] = [];
      if (rounds.length === 0) {
        // Return empty list
        return null;
      }
      const heats = _.flatten(await Promise.all(rounds.map((round) => heatService.getHeatsByRoundId(round.id))));
      if (heats.length === 0) {
        // Return empty list
        return null;
      }
      const rankHeatRiders = async (heat: Heat) => {
        const status = await heatService.getStatus(heat);
        if ([HeatStatus.SELECTED_FINISHED, HeatStatus.FINISHED].includes(status)) {
          const rankedRiders = await riderAllocationService.getSortedRiderAllocationsByHeatId(heat.id);
          return {
            heat,
            rankedRiders,
          };
        }
        const unrankedRiders = await riderAllocationService.getRiderAllocationsByHeatId(heat.id);

        return {
          heat,
          unrankedRiders,
        };
      };
      const rankMap: Map<number, RiderAllocation> = new Map();
      const rankedHeats = await Promise.all(heats.map((heat) => rankHeatRiders(heat)));
      rankedHeats.forEach(({ heat, rankedRiders, unrankedRiders }) => {
        rankedRiders?.forEach((ra, i) => {
          if (!rankMap.get(heat.seedSlots[i].seed)) {
            rankMap.set(heat.seedSlots[i].seed, ra);
          }
        });
        unrankedRiders?.forEach((ra) => {
          unrankedRidersAllocations.push(ra);
        });
      });
      const seeds = [...rankMap.keys()];
      const rankedRiders = _.sortBy(seeds).map((seed, i) => {
        const riderAllocation = rankMap.get(seed);
        const riderRank = new RiderRank();
        riderRank.userId = riderAllocation.userId;
        riderRank.rank = i + 1;
        return riderRank;
      });
      const timeB = new Date().getTime();
      const unrankedRiders = unrankedRidersAllocations
        .filter((ra) => !rankedRiders.find(({ userId }) => userId === ra.userId))
        .map((ra) => {
          const riderRank = new RiderRank();
          riderRank.userId = ra.userId;
          return riderRank;
        });

      console.log(`getRankedRiders took ${timeB - timeA}`);

      return {
        rankedRiders,
        unrankedRiders,
      };
    };

    const getRiderRanking = async (competitionId: string): Promise<RiderRanking> => {
      const sortRiderRanksByUserLastName = async (riderRanks: RiderRank[]): Promise<RiderRank[]> => {
        // Sort unranked by lastname
        const getUser = async (riderRank: RiderRank) => ({
          riderRank,
          user: await userService.getOne(riderRank.userId),
        });
        const ranksWithUser = await Promise.all(riderRanks.map((rank) => getUser(rank)));

        riderRanks = _.orderBy(ranksWithUser, ({ user }) => user.lastName).map(({ riderRank }) => riderRank);
        return riderRanks;
      };
      const competition = await competitionService.getOne(competitionId);
      const heatRiderRanking = await getRiderRankingFromHeats(competition);
      const registeredRiders = await riderRegistationService.getRiderRegistrationsByCompetitionId(competitionId);
      // Add any extra registered riders as unranked
      registeredRiders.forEach((registeredRider) => {
        if (
          !heatRiderRanking.rankedRiders.find((r) => r.userId === registeredRider.userId) &&
          !heatRiderRanking.unrankedRiders.find((r) => r.userId === registeredRider.userId)
        ) {
          const unrankedRider = new RiderRank();
          unrankedRider.userId = registeredRider.userId;
          heatRiderRanking.unrankedRiders.push(unrankedRider);
        }
      });
      return {
        competitionId,
        rankedRiders: new RiderRankList(heatRiderRanking.rankedRiders),
        unrankedRiders: new RiderRankList(await sortRiderRanksByUserLastName(heatRiderRanking.unrankedRiders)),
      };
    };

    this.riderRankingDataLoader = new DataLoader(
      async (keys: string[]) => {
        const uniqueKeys = _.uniq(keys);
        const competitionRankings = await Promise.all(uniqueKeys.map((competitionId) => getRiderRanking(competitionId)));
        const riderRankingMap: { [key: string]: RiderRanking } = {};
        competitionRankings.forEach((result) => {
          riderRankingMap[result.competitionId] = result;
        });
        return keys.map((key) => riderRankingMap[key]);
      },
      { cache: true }
    );
  }

  public async getIsJudge(competitionId: string): Promise<boolean> {
    const competition = await this.getOne(competitionId);
    return this.context.identity.user?.username === competition.judgeUserId;
  }

  public async getCompetitionsByEventId(eventId: string): Promise<Competition[]> {
    return this.repository.query().index(commonConfig.DB_SCHEMA.Competition.indexes.byEvent.indexName).wherePartitionKey(eventId).execFetchAll();
  }

  async getRankedRiders(competitionId: string): Promise<RiderRankList> {
    this.initDataLoader();
    const { rankedRiders } = await this.riderRankingDataLoader.load(competitionId);
    return rankedRiders;
  }

  async getUnrankedRiders(competitionId: string): Promise<RiderRankList> {
    this.initDataLoader();
    const { unrankedRiders } = await this.riderRankingDataLoader.load(competitionId);
    return unrankedRiders;
  }

  async getBreadcrumbs(competition: Competition): Promise<Link[]> {
    const eventService = this.context.getService(EventService);
    const linkToCompetition = new Link(LinkType.COMPETITION, competition.name, competition.id);
    const event = await eventService.getOne(competition.eventId);
    const eventBreadcrumbs = await eventService.getBreadcrumbs(event);
    return [...eventBreadcrumbs, linkToCompetition];
  }

  async getLongName(competition: Competition): Promise<string> {
    return competition.name;
  }

  async getScheduleItems(schedule: Schedule): Promise<ScheduleItem[]> {
    const scheduleItemService = this.context.getService(ScheduleItemService);
    return scheduleItemService.getScheduleItemsByScheduleId(schedule.id);
  }

  async getChildren(competition: Competition): Promise<Creatable[]> {
    const roundService = this.context.getService(RoundService);
    const scheduleItemService = this.context.getService(ScheduleItemService);
    const riderRegistationService = this.context.getService(RiderRegistrationService);

    const [rounds, scheduleItems, riderRegistations] = await Promise.all([
      roundService.getRoundsByCompetitionId(competition.id),
      scheduleItemService.getScheduleItemsByScheduleId(competition.id),
      riderRegistationService.getRiderRegistrationsByCompetitionId(competition.id),
    ]);
    return [...rounds, ...scheduleItems, ...riderRegistations];
  }
}
