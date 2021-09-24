import { Service } from 'typedi';
import { Resolver, FieldResolver, Root, MiddlewareFn } from 'type-graphql';
import { Logger } from 'src/logger';
import User from 'src/domain/models/user';
import { UserService } from 'src/services/user.service';
import * as crud from 'src/crud-resolver-builders';
import errorMessage from 'src/config/error-message';
import { AuthCheck } from 'src/middleware/auth-check/types';
import { IContext } from 'src/typegraphql-setup/context';
import { IdentityType } from 'src/types';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { UpdateUserInput, CreateUserInput } from 'src/inputs';
import { buildCrudResolver, CrudCofig } from './crud-builder';

const addDefaultUserId: MiddlewareFn<IContext> = async ({ args, context: { identity } }, next) => {
  args.id = args.id || identity.user?.username;
  if (!args.id) {
    return null;
  }
  return next();
};

const isAllowedToEditUser: AuthCheck = async ({ args, context }) => {
  const userService = context.getService(UserService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const input = args.input as UpdateUserInput;
  const user = await userService.getOne(input.id);
  if (user.id === context.identity.user?.username) {
    return true;
  }
  throw new Error(errorMessage.auth.notYou);
};

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => User)
export class UserResolver extends buildCrudResolver(
  new CrudCofig({
    returnType: User,
    suffix: 'User',
    reolverBuilders: [
      new crud.Resolvers.GetOne({ middleware: [addDefaultUserId], resolverOptions: { nullable: true }, argOptions: { nullable: true } }),
      new crud.Resolvers.GetMany(),
      new crud.Resolvers.CreateOne({ inputType: CreateUserInput, middleware: [createAuthMiddleware()] }),
      new crud.Resolvers.UpdateOne({ inputType: UpdateUserInput, middleware: [createAuthMiddleware([isAllowedToEditUser])] }),
      new crud.Resolvers.DeleteOne({ middleware: [createAuthMiddleware()] }),
    ],
  })
)<User> {
  constructor(private readonly userService: UserService, private readonly logger: Logger) {
    super({ service: userService });
  }

  @FieldResolver(() => Boolean)
  isMe(@Root() user: User): boolean {
    return this.context.identity.user?.username === user.id;
  }
}
