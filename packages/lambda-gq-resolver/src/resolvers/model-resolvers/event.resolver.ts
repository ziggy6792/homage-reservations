/* eslint-disable class-methods-use-this */
import { Service } from 'typedi';
import { Resolver, Root, FieldResolver, MiddlewareFn } from 'type-graphql';

import { Logger } from 'src/logger';
import Event from 'src/domain/models/event';
import { EventService } from 'src/services/event.service';
import * as crud from 'src/crud-resolver-builders';
import { UserService } from 'src/services/user.service';
import User from 'src/domain/models/user';
import Heat from 'src/domain/models/heat';
import { HeatService } from 'src/services/heat.service';
import { CompetitionList, ScheduleItemList } from 'src/domain/objects/lists';
import { CompetitionService } from 'src/services/competition.service';
import { ScheduleItemService } from 'src/services/schedule-item.service';
import { IContext } from 'src/typegraphql-setup/context';
import errorMessage from 'src/config/error-message';
import { AuthCheck } from 'src/middleware/auth-check/types';
import { IdentityType } from 'src/types';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import isAuthUser from 'src/middleware/auth-check/is-auth-user';
import { CreateEventInput, UpdateEventInput } from 'src/inputs';
import { ScheduleService } from 'src/services/schedule.service';
import { buildCrudResolver, CrudCofig } from './crud-builder';

const addDefaultUserId: MiddlewareFn<IContext> = async ({ args, context: { identity } }, next) => {
  const input = args.input as CreateEventInput;
  input.adminUserId = input.adminUserId || identity.user?.username;
  if (!input.adminUserId) {
    throw new Error(errorMessage.auth.noUserId);
  }
  return next();
};

const isAllowedToEditEvent: AuthCheck = async ({ args, context }) => {
  const eventService = context.getService(EventService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const input = args.input as UpdateEventInput;
  const event = await eventService.getOne(input.id);
  if (event.adminUserId === context.identity.user?.username) {
    return true;
  }
  throw new Error(errorMessage.auth.notEventAdmin);
};

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => Event)
export class EventResolver extends buildCrudResolver(
  new CrudCofig({
    returnType: Event,
    suffix: 'Event',
    reolverBuilders: [
      new crud.Resolvers.GetOne(),
      new crud.Resolvers.GetMany(),
      new crud.Resolvers.CreateOne({ inputType: CreateEventInput, middleware: [addDefaultUserId, createAuthMiddleware([isAuthUser])] }),
      new crud.Resolvers.UpdateOne({ inputType: UpdateEventInput, middleware: [createAuthMiddleware([isAllowedToEditEvent])] }),
      new crud.Resolvers.DeleteOne({ middleware: [createAuthMiddleware([isAllowedToEditEvent])] }),
    ],
  })
)<Event> {
  constructor(
    private readonly eventService: EventService,
    private readonly userService: UserService,
    private readonly heatService: HeatService,
    private readonly competitionService: CompetitionService,
    private readonly scheduleItemService: ScheduleItemService,
    private readonly logger: Logger
  ) {
    super({ service: eventService });
  }

  @FieldResolver(() => User)
  async adminUser(@Root() event: Event): Promise<User> {
    return this.userService.getOne(event.adminUserId);
  }

  @FieldResolver(() => Boolean)
  async isAdmin(@Root() event: Event): Promise<boolean> {
    return this.eventService.getIsAdmin(event.id);
  }

  @FieldResolver(() => Heat, { nullable: true })
  async selectedHeat(@Root() event: Event): Promise<Heat> {
    if (!event.selectedHeatId) {
      return null;
    }
    return this.heatService.getOne(event.selectedHeatId);
  }

  @FieldResolver(() => CompetitionList)
  async competitions(@Root() event: Event): Promise<CompetitionList> {
    const list = new CompetitionList();
    list.items = await this.competitionService.getCompetitionsByEventId(event.id);
    return list;
  }
}
