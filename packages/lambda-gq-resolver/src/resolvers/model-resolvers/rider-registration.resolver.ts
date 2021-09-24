import { Service } from 'typedi';
import { FieldResolver, MiddlewareFn, Resolver, Root } from 'type-graphql';
import { Logger } from 'src/logger';
import RiderRegistration from 'src/domain/models/rider-registration';
import { RiderRegistrationService } from 'src/services/rider-registration.service';
import * as crud from 'src/crud-resolver-builders';
import User from 'src/domain/models/user';
import { UserService } from 'src/services/user.service';
import Competition from 'src/domain/models/competition';
import { CompetitionService } from 'src/services/competition.service';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { IdentityType } from 'src/types';
import errorMessage from 'src/config/error-message';
import { IContext } from 'src/typegraphql-setup/context';
import _ from 'lodash';
import { AuthCheck } from 'src/middleware/auth-check/types';
import { EventService } from 'src/services';
import { CreateRiderRegistratiionInput, UpdateRiderRegistrationInput, DeleteRiderRegistrationInput } from 'src/inputs';
import { buildCrudResolver, CrudCofig } from './crud-builder';

const isUserAllowedToCreateDeleteOne: AuthCheck = async ({ args, context: { identity } }) => {
  if (identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const input = args.input as CreateRiderRegistratiionInput;
  if (identity.user?.username === input.userId) {
    return true;
  }
  throw new Error(errorMessage.auth.notAuthenticated);
};

const checkRegistrationIsOpen: MiddlewareFn<IContext> = async ({ args, context }, next) => {
  const competitionService = context.getService(CompetitionService);
  const input = args.input as CreateRiderRegistratiionInput;
  const competition = await competitionService.getOne(input.competitionId);
  if (competition.isRegistrationClosed) {
    throw new Error(errorMessage.registrationIsClosed);
  }
  return next();
};

const isUserAllowedToUpdateMany: AuthCheck = async ({ args, context }) => {
  const competitionService = context.getService(CompetitionService);
  const eventService = context.getService(EventService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const riderRegistrations = args.input as UpdateRiderRegistrationInput[];
  const competitionIds = _.uniqWith(
    riderRegistrations.map((input) => ({ id: input.competitionId })),
    _.isEqual
  );
  const competitions = await competitionService.batchGet(competitionIds);
  const eventIds = _.uniqWith(
    competitions.map((competition) => ({ id: competition.eventId })),
    _.isEqual
  );
  // Get competition events
  const events = await eventService.batchGet(eventIds);
  // Check that user is admin of those events
  events.forEach((event) => {
    if (event.adminUserId !== context.identity.user?.username) {
      throw new Error(errorMessage.auth.notCompetitionAdmin);
    }
  });
  return true;
};

const addDefaultUserId: MiddlewareFn<IContext> = async ({ args, context: { identity } }, next) => {
  const input = args.input as CreateRiderRegistratiionInput;
  input.userId = input.userId || identity.user?.username;
  if (!input.userId) {
    throw new Error(errorMessage.auth.noUserId);
  }
  return next();
};

const addDefaultStartSeed: MiddlewareFn<IContext> = async ({ args, context }, next) => {
  const riderRegistrationService = context.getService(RiderRegistrationService);
  const input = args.input as CreateRiderRegistratiionInput;
  const existingRiderRegistrations = await riderRegistrationService.getRiderRegistrationsByCompetitionId(input.competitionId);
  const highestSeed = existingRiderRegistrations.length > 0 ? _.maxBy(existingRiderRegistrations, (ra) => ra.startSeed)?.startSeed : 0;
  input.startSeed = highestSeed + 1;
  return next();
};

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => RiderRegistration)
export class RiderRegistrationResolver extends buildCrudResolver(
  new CrudCofig({
    returnType: RiderRegistration,
    suffix: 'RiderRegistration',
    idFields: { partitionKey: 'competitionId', sortKey: 'userId' },
    reolverBuilders: [
      new crud.Resolvers.CreateOne({
        inputType: CreateRiderRegistratiionInput,
        middleware: [addDefaultUserId, addDefaultStartSeed, checkRegistrationIsOpen, createAuthMiddleware([isUserAllowedToCreateDeleteOne])],
      }),
      new crud.Resolvers.CreateMany({
        inputType: CreateRiderRegistratiionInput,
        middleware: [createAuthMiddleware()],
      }),
      new crud.Resolvers.UpdateMany({ inputType: UpdateRiderRegistrationInput, middleware: [createAuthMiddleware([isUserAllowedToUpdateMany])] }),
      new crud.Resolvers.DeleteOne({
        inputType: DeleteRiderRegistrationInput,
        middleware: [addDefaultUserId, checkRegistrationIsOpen, createAuthMiddleware([isUserAllowedToCreateDeleteOne])],
      }),
    ],
  })
)<RiderRegistration> {
  constructor(
    private readonly riderRegistrationService: RiderRegistrationService,
    private readonly userService: UserService,
    private readonly competitionService: CompetitionService
  ) {
    super({ service: riderRegistrationService });
  }

  @FieldResolver(() => User, { nullable: true })
  async user(@Root() riderRegistration: RiderRegistration): Promise<User> {
    return this.userService.getOne(riderRegistration.userId);
  }

  @FieldResolver(() => Competition, { nullable: true })
  async competition(@Root() riderRegistration: RiderRegistration): Promise<Competition> {
    return this.competitionService.getOne(riderRegistration.competitionId);
  }
}
