/* eslint-disable no-useless-constructor */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */

import { Resolver, Mutation, Arg, ID, UseMiddleware } from 'type-graphql';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import Competition from 'src/domain/models/competition';
import isCompetitionAdmin from 'src/middleware/auth-check/is-comp-admin';
import _ from 'lodash';
import User from 'src/domain/models/user';
import RiderRegistration from 'src/domain/models/rider-registration';
import { Service } from 'typedi';
import { BatchCreatableService, CompetitionService, RiderRegistrationService, UserService } from 'src/services';
import { SignUpRiderInput } from 'src/inputs';

@Service()
@Resolver()
export default class SignUpCompetition {
  constructor(
    private readonly userService: UserService,
    private readonly riderRegistrationService: RiderRegistrationService,
    private readonly batchCreatableService: BatchCreatableService,
    private readonly competitionService: CompetitionService
  ) {}

  @Mutation(() => Competition, { nullable: true })
  @UseMiddleware([createAuthMiddleware([isCompetitionAdmin])])
  async signUpCompetition(@Arg('id', () => ID) id: string, @Arg('riders', () => [SignUpRiderInput]) riders: SignUpRiderInput[]): Promise<Competition> {
    const competition = await this.competitionService.getOne(id);

    if (_.uniqBy(riders, ({ firstName, lastName }) => User.GetFullNameHash(firstName, lastName)).length !== riders.length) {
      throw new Error('No Duplicates. 2 or more riders entered are the same.');
    }

    const getUserId = async (input: SignUpRiderInput) => {
      const { firstName, lastName } = input;
      const fullNameHash = User.GetFullNameHash(firstName, lastName);
      const existingUsers = await this.userService.find({ fullNameHash });
      if (existingUsers?.length > 0) {
        return existingUsers[0].id;
      }
      const newUser = new User();
      newUser.firstName = firstName;
      newUser.lastName = lastName;
      newUser.isDbOnlyUser = true;
      await this.userService.createOne(newUser);
      return newUser.id;
    };

    const userIds = await Promise.all(riders.map((rider) => getUserId(rider)));

    const existingRiderRegistrations = await this.riderRegistrationService.getRiderRegistrationsByCompetitionId(competition.id);

    const createRiderRegistations = userIds.map((userId, i) => {
      const riderAllocation = new RiderRegistration();
      riderAllocation.competitionId = competition.id;
      riderAllocation.userId = userId;
      riderAllocation.startSeed = i + 1;
      return riderAllocation;
    });

    // Delete old
    await this.batchCreatableService.batchDelete(existingRiderRegistrations);

    // Create new
    await this.batchCreatableService.batchCreate(createRiderRegistations);

    return competition;
  }
}
