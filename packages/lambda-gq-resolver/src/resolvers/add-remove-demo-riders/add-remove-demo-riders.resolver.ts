/* eslint-disable no-useless-constructor */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */

import { Resolver, Mutation, Arg, ID, UseMiddleware } from 'type-graphql';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import Competition from 'src/domain/models/competition';
import isCompetitionAdmin from 'src/middleware/auth-check/is-comp-admin';
import errorMessage from 'src/config/error-message';
import _ from 'lodash';
import { attribute, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT } from '@shiftcoders/dynamo-easy';
import RiderRegistration from 'src/domain/models/rider-registration';
import BatchWriteRequest from 'src/utils/dynamo-easy/batch-write-request';
import User from 'src/domain/models/user';
import { Service } from 'typedi';
import { HeatService, RoundService, CompetitionService, RiderRegistrationService, RiderAllocationService, BatchCreatableService } from 'src/services';

@Service()
@Resolver()
export default class AddRemoveDemoRiders {
  constructor(
    private readonly heatService: HeatService,
    private readonly roundService: RoundService,
    private readonly competitionService: CompetitionService,
    private readonly riderRegistrationService: RiderRegistrationService,
    private readonly riderAllocationService: RiderAllocationService,
    private readonly batchCreatableService: BatchCreatableService
  ) {}

  @Mutation(() => Competition, { nullable: true })
  @UseMiddleware([createAuthMiddleware([isCompetitionAdmin])])
  async addRemoveDemoRiders(@Arg('id', () => ID) id: string): Promise<Competition> {
    const competition = await this.competitionService.getOne(id);
    const rounds = await this.roundService.getRoundsByCompetitionId(competition.id, { roundNo: 1 });
    if (rounds.length !== 1) {
      throw new Error(errorMessage.canNotFindRound1);
    }
    const round1 = rounds[0];
    const round1Heats = await this.heatService.getHeatsByRoundId(round1.id);

    const noOfRiders = _.sum(round1Heats.map((heat) => heat.getSize()));

    // const existingRiderRegistrations = await competition.getRiderRegistrations();
    const existingRiderRegistrations = await this.riderRegistrationService.getRiderRegistrationsByCompetitionId(competition.id);
    const existingDemoRiderAllocations = existingRiderRegistrations.filter((ra) => User.IsDemoUserId(ra.userId));
    const existingRealRiderAllocations = existingRiderRegistrations.filter((ra) => !User.IsDemoUserId(ra.userId));

    const highestSeed = existingRealRiderAllocations.length > 0 ? _.maxBy(existingRealRiderAllocations, (ra) => ra.startSeed)?.startSeed : 0;

    let createRiderRogstrations: RiderRegistration[] = [];

    if (existingDemoRiderAllocations.length === 0) {
      createRiderRogstrations = _.range(highestSeed + 1, highestSeed + noOfRiders + 1).map((startSeed, index) => {
        const userLetter = String.fromCharCode(index + 65);
        const riderAllocation = new RiderRegistration();
        riderAllocation.competitionId = competition.id;
        riderAllocation.userId = User.CreateDemoUser(`${User.DemoUserPrefix}-${competition.id}-${userLetter}`).id;
        riderAllocation.startSeed = startSeed;

        return riderAllocation;
      });
    }

    // Delete old
    await this.batchCreatableService.batchDelete(existingDemoRiderAllocations);

    // Create new
    await this.batchCreatableService.batchCreate(createRiderRogstrations);

    return competition;
  }
}
