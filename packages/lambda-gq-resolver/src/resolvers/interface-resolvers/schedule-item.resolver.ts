/* eslint-disable no-underscore-dangle */
import { Service } from 'typedi';
import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Logger } from 'src/logger';
import * as crud from 'src/crud-resolver-builders';
import ScheduleItem from 'src/domain/models/schedule-item';
import { ScheduleItemService } from 'src/services/schedule-item.service';
import Schedulable from 'src/domain/interfaces/schedulable';
import { RoundService } from 'src/services/round.service';
import Schedule from 'src/domain/interfaces/schedule';
import { EventService } from 'src/services/event.service';
import { CompetitionService } from 'src/services/competition.service';
import * as utils from 'src/utils/utility';
import { IdentityType } from 'src/types';
import errorMessage from 'src/config/error-message';
import { AuthCheck } from 'src/middleware/auth-check/types';
import Event from 'src/domain/models/event';
import Competition from 'src/domain/models/competition';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { IContext } from 'src/typegraphql-setup/context';
import { CreateScheduleItemInput, UpdateScheduleItemInput } from 'src/inputs';
import { buildCrudResolver, CrudCofig } from 'src/resolvers/model-resolvers/crud-builder';

const isAdminOfScheduleEvent = async (scheduleId: string, context: IContext): Promise<boolean> => {
  const competitionService = context.getService(CompetitionService);
  const eventService = context.getService(EventService);
  const schedule = (await utils.multiServiceGet([competitionService, eventService], scheduleId)) as Schedule;
  let event: Event;
  if (schedule.__typename === 'Event') {
    event = schedule as Event;
  }
  if (schedule.__typename === 'Competition') {
    const competition = schedule as Competition;
    event = await eventService.getOne(competition.eventId);
  }
  if (event.adminUserId === context.identity.user?.username) {
    return true;
  }
  throw new Error(errorMessage.auth.notCompetitionAdmin);
};

const isAllowedToCreateScheduleItem: AuthCheck = async ({ args, context }) => {
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const input = args.input as CreateScheduleItemInput;
  return isAdminOfScheduleEvent(input.scheduleId, context);
};

const isAllowedToEditScheduleItem: AuthCheck = async ({ args, context }) => {
  const scheduleItemService = context.getService(ScheduleItemService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const input = args.input as UpdateScheduleItemInput;
  const scheduleItem = await scheduleItemService.getOne(input.id);
  return isAdminOfScheduleEvent(scheduleItem.scheduleId, context);
};

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => ScheduleItem)
export class ScheduleItemResolver extends buildCrudResolver(
  new CrudCofig({
    returnType: ScheduleItem,
    suffix: 'ScheduleItem',
    reolverBuilders: [
      new crud.Resolvers.CreateOne({ inputType: CreateScheduleItemInput, middleware: [createAuthMiddleware([isAllowedToCreateScheduleItem])] }),
      new crud.Resolvers.UpdateOne({ inputType: UpdateScheduleItemInput, middleware: [createAuthMiddleware([isAllowedToEditScheduleItem])] }),
    ],
  })
  //
)<ScheduleItem> {
  constructor(
    private readonly scheduleItemService: ScheduleItemService,
    private readonly roundService: RoundService,
    private readonly eventService: EventService,
    private readonly competitionService: CompetitionService
  ) {
    super({ service: scheduleItemService });
  }

  @FieldResolver(() => Schedulable, { nullable: true })
  async scheduledItem(@Root() scheduleItem: ScheduleItem): Promise<Schedulable> {
    if (!scheduleItem.schedulableId) {
      return null;
    }
    return this.roundService.getOne(scheduleItem.schedulableId);
  }

  @FieldResolver(() => Schedule, { nullable: true })
  async schedule(@Root() scheduleItem: ScheduleItem): Promise<Schedule> {
    if (!scheduleItem.scheduleId) {
      return null;
    }
    return utils.multiServiceGet([this.competitionService, this.eventService], scheduleItem.scheduleId) as Promise<Schedule>;
  }
}
