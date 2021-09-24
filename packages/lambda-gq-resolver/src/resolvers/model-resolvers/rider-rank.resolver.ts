/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
import { Service } from 'typedi';
import { FieldResolver, Int, Resolver, Root } from 'type-graphql';
import { Logger } from 'src/logger';
import RiderAllocation from 'src/domain/models/rider-allocation';
import User from 'src/domain/models/user';
import { UserService } from 'src/services/user.service';
import RiderRank from 'src/domain/objects/rider-rank/rider-rank';

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => RiderRank)
export class RiderRankResolver {
  constructor(private readonly userService: UserService, private readonly logger: Logger) {}

  @FieldResolver(() => User, { nullable: true })
  async user(@Root() riderAllocation: RiderAllocation): Promise<User> {
    return this.userService.getOne(riderAllocation.userId);
  }
}
