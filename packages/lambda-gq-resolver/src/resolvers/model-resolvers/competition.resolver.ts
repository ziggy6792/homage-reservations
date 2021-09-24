import { Inject, Service } from 'typedi';
import { Resolver, Query, FieldResolver, Root, Field } from 'type-graphql';

import { Logger } from 'src/logger';
import * as crud from 'src/crud-resolver-builders';
import Competition, { CompetitionStatus } from 'src/domain/models/competition';
import { CompetitionService } from 'src/services/competition.service';
import { RoundService } from 'src/services/round.service';
import _ from 'lodash';
import { HeatService } from 'src/services/heat.service';
import User from 'src/domain/models/user';
import { UserService } from 'src/services/user.service';
import Event from 'src/domain/models/event';
import { EventService } from 'src/services/event.service';
import { RiderRegistrationService } from 'src/services/rider-registration.service';
import { RiderAllocationList, RiderRankList, RiderRegistrationList, RoundList } from 'src/domain/objects/lists';
import { ScheduleItemService } from 'src/services/schedule-item.service';
import { RiderAllocationService } from 'src/services/rider-allocation.service';
import { AuthCheck } from 'src/middleware/auth-check/types';
import { IdentityType } from 'src/types';
import errorMessage from 'src/config/error-message';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { CreateCompetitionInput, UpdateCompetitionInput } from 'src/inputs';
import Context from 'src/typegraphql-setup/context';
import { buildCrudResolver, CrudCofig } from './crud-builder';

const isAllowedToCreateComp: AuthCheck = async ({ args, context }) => {
  const eventService = context.getService(EventService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const input = args.input as CreateCompetitionInput;
  const event = await eventService.getOne(input.eventId);
  if (event.adminUserId === context.identity.user?.username) {
    return true;
  }
  throw new Error(errorMessage.auth.notCompetitionAdmin);
};

const isAllowedToEditComp: AuthCheck = async ({ args, context }) => {
  const eventService = context.getService(EventService);
  const competitionService = context.getService(CompetitionService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const input = args.input as UpdateCompetitionInput;
  const competition = await competitionService.getOne(input.id);
  const event = await eventService.getOne(competition.eventId);
  if (event.adminUserId === context.identity.user?.username) {
    return true;
  }
  throw new Error(errorMessage.auth.notCompetitionAdmin);
};

const createCompMiddleware = [createAuthMiddleware([isAllowedToCreateComp])];
const editCompMiddleware = [createAuthMiddleware([isAllowedToEditComp])];

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => Competition)
export class CompetitionResolver extends buildCrudResolver(
  new CrudCofig({
    returnType: Competition,
    suffix: 'Competition',
    reolverBuilders: [
      new crud.Resolvers.GetOne(),
      new crud.Resolvers.GetMany(),
      new crud.Resolvers.CreateOne({ inputType: CreateCompetitionInput, middleware: createCompMiddleware }),
      new crud.Resolvers.UpdateOne({ inputType: UpdateCompetitionInput, middleware: editCompMiddleware }),
      new crud.Resolvers.DeleteOne({ middleware: editCompMiddleware }),
    ],
  })
)<Competition> {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly roundService: RoundService,
    private readonly heatService: HeatService,
    private readonly userService: UserService,
    private readonly eventService: EventService,
    private readonly riderRegistationService: RiderRegistrationService,
    private readonly riderAllocationService: RiderAllocationService,
    private readonly scheduleItemService: ScheduleItemService
  ) {
    super({ service: competitionService });
  }

  @FieldResolver(() => CompetitionStatus)
  async status(@Root() competition: Competition): Promise<CompetitionStatus> {
    if (!competition.isRegistrationClosed) {
      return CompetitionStatus.REGISTRATION_OPEN;
    }
    const rounds = await this.roundService.getRoundsByCompetitionId(competition.id);
    if (rounds.length > 0) {
      const finalRound = _.last(rounds);
      const finalHeats = await this.heatService.getHeatsByRoundId(finalRound.id);
      if (finalHeats.length !== 1) {
        throw new Error('Final round must only have 1 heat');
      }
      const [finalHeat] = finalHeats;
      if (finalHeat.isFinished) {
        return CompetitionStatus.FINISHED;
      }
    }
    return CompetitionStatus.REGISTRATION_CLOSED;
  }

  @FieldResolver(() => User, { nullable: true })
  async judgeUser(@Root() competition: Competition): Promise<User> {
    if (!competition.judgeUserId) {
      return null;
    }
    return this.userService.getOne(competition.judgeUserId);
  }

  @FieldResolver(() => Event)
  async event(@Root() competition: Competition): Promise<Event> {
    return this.eventService.getOne(competition.eventId);
  }

  @FieldResolver(() => Boolean)
  async isAdmin(@Root() competition: Competition): Promise<boolean> {
    return this.eventService.getIsAdmin(competition.eventId);
  }

  @FieldResolver(() => Boolean)
  async isJudge(@Root() competition: Competition): Promise<boolean> {
    return this.competitionService.getIsJudge(competition.id);
  }

  @FieldResolver(() => Boolean)
  async isRegistered(@Root() competition: Competition): Promise<boolean> {
    return this.riderRegistationService.getIsRegistered(competition.id);
  }

  @FieldResolver(() => RoundList)
  protected async rounds(@Root() competition: Competition): Promise<RoundList> {
    const list = new RoundList();
    list.items = await this.roundService.getRoundsByCompetitionId(competition.id);
    return list;
  }

  @FieldResolver(() => Date, { nullable: true })
  async startTime(@Root() competition: Competition): Promise<Date> {
    const rounds = await this.roundService.getRoundsByCompetitionId(competition.id, { roundNo: 1 });
    if (rounds?.length !== 1) {
      return null;
    }
    const [firstRound] = rounds;
    const scheduleItem = await this.scheduleItemService.getScheduleItemBySchedulableId(firstRound.id);
    return scheduleItem.startTime;
  }

  @FieldResolver(() => Boolean)
  protected async hasDemoRiders(@Root() competition: Competition): Promise<boolean> {
    return this.riderRegistationService.hasDemoRiders(competition.id);
  }

  // Rank all riders based on their performance in the most recent heat they were/are in
  // ToDo: refacotor RiderRankList -> UserList
  @FieldResolver(() => RiderRankList)
  protected async firstRoundRiders(@Root() competition: Competition): Promise<RiderRankList> {
    const rounds = await this.roundService.getRoundsByCompetitionId(competition.id, { roundNo: 1 });

    if (rounds.length === 0) {
      // Return empty list
      return new RiderRankList();
    }
    const round1 = rounds[0];

    const heats = await this.heatService.getHeatsByRoundId(round1.id);

    const rankedRiders = await this.riderAllocationService.rankHeats(heats.map((heat) => heat.id));

    return new RiderRankList(rankedRiders);
  }

  @FieldResolver(() => RiderAllocationList)
  public async winners(@Root() competition: Competition): Promise<RiderAllocationList> {
    // ToDo get the last round only using the comp params

    const rounds = await this.roundService.getRoundsByCompetitionId(competition.id);
    if (rounds.length === 0) {
      // Return empty list
      return new RiderAllocationList();
    }
    const finalRound = _.last(rounds);
    const finalHeats = await this.heatService.getHeatsByRoundId(finalRound.id);
    if (finalHeats.length !== 1) {
      // Return empty list
      return new RiderAllocationList();
    }
    const [finalHeat] = finalHeats;
    if (!finalHeat.isFinished) {
      // Return empty list
      return new RiderAllocationList();
    }
    const finalHeatRiders = await this.riderAllocationService.getSortedRiderAllocationsByHeatId(finalHeat.id);
    const winners = finalHeatRiders.slice(0, 3);
    return new RiderAllocationList(winners);
  }

  @FieldResolver(() => RiderRegistrationList)
  public async riderRegistrations(@Root() competition: Competition): Promise<RiderRegistrationList> {
    const list = new RiderRegistrationList();
    list.items = await this.riderRegistationService.getRiderRegistrationsByCompetitionId(competition.id);
    return list;
  }

  @FieldResolver(() => RiderRankList)
  protected async rankedRiders(@Root() competition: Competition): Promise<RiderRankList> {
    return this.competitionService.getRankedRiders(competition.id);
  }

  @FieldResolver(() => RiderRankList)
  protected async unrankedRiders(@Root() competition: Competition): Promise<RiderRankList> {
    return this.competitionService.getUnrankedRiders(competition.id);
  }
}
//
