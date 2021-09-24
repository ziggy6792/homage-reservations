/* eslint-disable class-methods-use-this */
import { Service } from 'typedi';
import { FieldResolver, Int, Resolver, Root } from 'type-graphql';
import { Logger } from 'src/logger';
import { RiderAllocationService } from 'src/services/rider-allocation.service';
import RiderAllocation from 'src/domain/models/rider-allocation';
import User from 'src/domain/models/user';
import { UserService } from 'src/services/user.service';
import { CreatableResolver } from './creatable.resolver';

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => RiderAllocation)
export class RiderAllocationResolver extends CreatableResolver<RiderAllocation> {
  constructor(private readonly riderAllocationService: RiderAllocationService, private readonly userService: UserService, private readonly logger: Logger) {
    super({ service: riderAllocationService });
  }

  @FieldResolver(() => Int, { nullable: true })
  async position(@Root() riderAllocation: RiderAllocation): Promise<number | null> {
    return this.riderAllocationService.getPosition(riderAllocation);
  }

  @FieldResolver(() => Int, { nullable: true })
  async rankOrder(@Root() riderAllocation: RiderAllocation): Promise<number | null> {
    return this.riderAllocationService.getRankOrder(riderAllocation);
  }

  @FieldResolver(() => Int, { nullable: true })
  async startOrder(@Root() riderAllocation: RiderAllocation): Promise<number | null> {
    return this.riderAllocationService.getStartOrder(riderAllocation);
  }

  @FieldResolver(() => User, { nullable: true })
  async user(@Root() riderAllocation: RiderAllocation): Promise<User> {
    return this.userService.getOne(riderAllocation.userId);
  }
}
