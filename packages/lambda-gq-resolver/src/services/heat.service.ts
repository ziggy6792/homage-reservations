/* eslint-disable class-methods-use-this */
import { commonConfig } from '@alpaca-backend/common';
import Heat, { HeatStatus, SeedSlot } from 'src/domain/models/heat';
import HeatRepository from 'src/repositories/heat.respository';
import { Service } from 'typedi';
import Link, { LinkType } from 'src/domain/objects/link';
import Round, { RoundType } from 'src/domain/models/round';
import _ from 'lodash';
import Creatable from 'src/domain/interfaces/creatable';
import CreatableService from './creatable.service';
import { DataEntityService } from './data-entity.service';
import { RoundService } from './round.service';
import { SeedSlotService } from './seed-slot.service';
import { EventService, RiderAllocationService, RiderRegistrationService } from '.';

// this service will be global - shared by every request
@Service()
@Service({ id: Heat })
export class HeatService extends CreatableService<Heat> implements DataEntityService {
  constructor(protected readonly repository: HeatRepository) {
    super();
  }

  public async getHeatsByRoundId(roundId: string): Promise<Heat[]> {
    return this.repository.query().index(commonConfig.DB_SCHEMA.Heat.indexes.byRound.indexName).wherePartitionKey(roundId).execFetchAll();
  }

  async getIncomingHeats(heat: Heat): Promise<Heat[]> {
    const incomingHeatIds = _.uniq(heat.seedSlots.map(({ previousHeatId }) => previousHeatId)).filter(_.identity);
    if (incomingHeatIds.length < 1) {
      return [];
    }
    const incomingHeats = await this.batchGet(
      incomingHeatIds.map((id) => ({
        id,
      }))
    );

    return incomingHeats as Heat[];
  }

  async getNoProgressing(heat: Heat): Promise<number> {
    const seedslotService = this.context.getService(SeedSlotService);
    const progressising = await Promise.all(heat.seedSlots.map((seedSlot) => seedslotService.getIsProgressing(seedSlot)));
    return progressising?.filter((progressising) => progressising)?.length || 0;
  }

  async getNoAllocated(heat: Heat): Promise<number> {
    const riderAllocationService = this.context.getService(RiderAllocationService);
    const riderAllocations = await riderAllocationService.getRiderAllocationsByHeatId(heat.id);
    return riderAllocations.length;
  }

  async getLongName(heat: Heat): Promise<string> {
    const roundService = this.context.container.get(RoundService);
    const round = await roundService.getOne(heat.roundId);
    return `${await roundService.getLongName(round)} - ${heat.name}`;
  }

  async getBreadcrumbs(heat: Heat): Promise<Link[]> {
    console.log('HEAT getBreadcrumbs!');
    const linkToHeat = new Link(LinkType.HEAT, heat.name, heat.id);
    const roundService = this.context.getService(RoundService);
    const round = await roundService.getOne(heat.roundId);
    const roundBreadcrumbs = await roundService.getBreadcrumbs(round);
    console.log([...roundBreadcrumbs, linkToHeat]);
    return [...roundBreadcrumbs, linkToHeat];
  }

  public async getChildren(heat: Heat): Promise<Creatable[]> {
    const riderAllocationService = this.context.getService(RiderAllocationService);
    return riderAllocationService.getRiderAllocationsByHeatId(heat.id);
  }

  async getStatus(heat: Heat): Promise<HeatStatus> {
    // ToDo index Event by selectedHeatId
    const eventService = this.context.getService(EventService);
    const riderAllocationService = this.context.getService(RiderAllocationService);

    const findMeSelected = await eventService.getSelectedEvent(heat.id);

    if (findMeSelected) {
      if (heat.isFinished) {
        return HeatStatus.SELECTED_FINISHED;
      }
      return HeatStatus.SELECTED_IN_PROGRESS;
    }

    if (heat.isFinished) {
      return HeatStatus.FINISHED;
    }

    const allocated = await riderAllocationService.getRiderAllocationsByHeatId(heat.id);

    if (allocated.length < heat.getSize()) {
      return HeatStatus.NOT_READY;
    }

    return HeatStatus.READY;
  }
}
