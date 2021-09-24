/* eslint-disable class-methods-use-this */
import { Service } from 'typedi';
import { Resolver, Query, FieldResolver, Root, Int, Field } from 'type-graphql';

import { Logger } from 'src/logger';
import Heat, { HeatStatus } from 'src/domain/models/heat';
import { HeatService } from 'src/services/heat.service';
import * as crud from 'src/crud-resolver-builders';
import Round from 'src/domain/models/round';
import { RoundService } from 'src/services/round.service';
import { CompetitionService } from 'src/services/competition.service';
import { EventService } from 'src/services/event.service';
import _ from 'lodash';
import { RiderAllocationList } from 'src/domain/objects/lists';
import { RiderAllocationService } from 'src/services/rider-allocation.service';
import { buildCrudResolver, CrudCofig } from './crud-builder';

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => Heat)
export class HeatResolver extends buildCrudResolver(
  new CrudCofig({
    returnType: Heat,
    suffix: 'Heat',
    reolverBuilders: [new crud.Resolvers.GetOne(), new crud.Resolvers.GetMany()],
  })
)<Heat> {
  constructor(
    private readonly heatService: HeatService,
    private readonly roundService: RoundService,
    private readonly competitionService: CompetitionService,
    private readonly eventService: EventService,
    private readonly riderAllocationService: RiderAllocationService,
    private readonly logger: Logger
  ) {
    super({ service: heatService });
  }

  @FieldResolver(() => Round)
  async round(@Root() heat: Heat): Promise<Round> {
    return this.roundService.getOne(heat.roundId);
  }

  @FieldResolver(() => Boolean)
  async isAdmin(@Root() heat: Heat): Promise<boolean> {
    const round = await this.roundService.getOne(heat.roundId);
    const competition = await this.competitionService.getOne(round.competitionId);
    const event = await this.eventService.getOne(competition.eventId);
    return this.eventService.getIsAdmin(event.id);
  }

  @FieldResolver(() => Boolean)
  async isJudge(@Root() heat: Heat): Promise<boolean> {
    const round = await this.roundService.getOne(heat.roundId);
    const competition = await this.competitionService.getOne(round.competitionId);
    return this.competitionService.getIsJudge(competition.id);
  }

  // / TODO CHANGE TO LIST
  @FieldResolver(() => [Heat])
  async incomingHeats(@Root() heat: Heat): Promise<Heat[]> {
    return this.heatService.getIncomingHeats(heat);
  }

  @FieldResolver(() => HeatStatus)
  async status(@Root() heat: Heat): Promise<HeatStatus> {
    // ToDo index Event by selectedHeatId
    return this.heatService.getStatus(heat);

    // const findMeSelected = await this.eventService.getSelectedHeat(heat.id);

    // if (findMeSelected) {
    //   if (heat.isFinished) {
    //     return HeatStatus.SELECTED_FINISHED;
    //   }
    //   return HeatStatus.SELECTED_IN_PROGRESS;
    // }

    // if (heat.isFinished) {
    //   return HeatStatus.FINISHED;
    // }

    // const allocated = await this.riderAllocationService.getRiderAllocationsByHeatId(heat.id);

    // if (allocated.length < heat.getSize()) {
    //   return HeatStatus.NOT_READY;
    // }

    // return HeatStatus.READY;
  }

  @FieldResolver(() => RiderAllocationList)
  protected async riderAllocations(@Root() heat: Heat): Promise<RiderAllocationList> {
    const list = new RiderAllocationList();
    list.items = await this.riderAllocationService.getSortedRiderAllocationsByHeatId(heat.id);
    return list;
  }

  @FieldResolver(() => Int)
  async noAllocated(@Root() heat: Heat): Promise<number> {
    return this.heatService.getNoAllocated(heat);
  }

  @FieldResolver(() => Int)
  async noProgressing(@Root() heat: Heat): Promise<number> {
    return this.heatService.getNoProgressing(heat);
  }
}
