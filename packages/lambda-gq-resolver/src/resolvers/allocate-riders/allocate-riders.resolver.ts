/* eslint-disable no-useless-constructor */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */

import { Resolver, Mutation, Arg, ID, UseMiddleware } from 'type-graphql';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import Competition from 'src/domain/models/competition';
import isCompetitionAdmin from 'src/middleware/auth-check/is-comp-admin';
import errorMessage from 'src/config/error-message';
import _ from 'lodash';
import RiderAllocation from 'src/domain/models/rider-allocation';
import { Service } from 'typedi';
import { CompetitionService, HeatService, RiderAllocationService, RiderRegistrationService, RoundService } from 'src/services';

@Service()
@Resolver()
export default class AllocateRiders {
  constructor(
    private readonly heatService: HeatService,
    private readonly roundService: RoundService,
    private readonly competitionService: CompetitionService,
    private readonly riderRegistrationService: RiderRegistrationService,
    private readonly riderAllocationService: RiderAllocationService
  ) {}

  @Mutation(() => Competition, { nullable: true })
  @UseMiddleware([createAuthMiddleware([isCompetitionAdmin])])
  async allocateRiders(@Arg('id', () => ID) id: string): Promise<Competition> {
    const competition = await this.competitionService.getOne(id);
    const rounds = await this.roundService.getRoundsByCompetitionId(competition.id);

    const round1 = rounds.find(({ roundNo }) => roundNo === 1);

    if (!round1) {
      throw new Error(errorMessage.canNotFindRound1);
    }

    const round1Heats = await this.heatService.getHeatsByRoundId(round1.id);

    const allHeats = _.flatten(await Promise.all(rounds.map((round) => this.heatService.getHeatsByRoundId(round.id))));
    const existingRiderAllocations = _.flatten(await Promise.all(allHeats.map((heat) => this.riderAllocationService.getRiderAllocationsByHeatId(heat.id))));

    // Map from each seed number to the round 1 heat it belongs to
    const seedHeatLookup: Map<number, string> = new Map();

    round1Heats.forEach((heat) => {
      heat.seedSlots.forEach((seedSlot) => {
        seedHeatLookup.set(seedSlot.seed, heat.id);
      });
    });

    const riderRegistrations = await this.riderRegistrationService.getRiderRegistrationsByCompetitionId(competition.id);

    const riderAllocationsLookup: Map<number, string> = new Map();
    riderRegistrations.forEach(({ startSeed, userId }) => {
      riderAllocationsLookup.set(startSeed, userId);
    });

    const createRiderAllocations: RiderAllocation[] = [];

    for (const seed of seedHeatLookup.keys()) {
      if (riderAllocationsLookup.get(seed) && seedHeatLookup.get(seed)) {
        const riderAllocation = new RiderAllocation();
        riderAllocation.heatId = seedHeatLookup.get(seed);
        riderAllocation.userId = riderAllocationsLookup.get(seed);
        riderAllocation.startSeed = seed;
        riderAllocation.initRuns();
        createRiderAllocations.push(riderAllocation);
      }
    }
    // Update heat statuses to CLOSED
    // await Promise.all(allHeats.map((heat) => this.heatService.updateOne({ id: heat.id, isFinished: null })));

    await this.heatService.updateMany(allHeats.map((heat) => ({ id: heat.id, isFinished: null })));

    console.log('UPDATED!!');

    // Clear selectedHeatId id its in here

    // Delete old
    await this.riderAllocationService.deleteMany(existingRiderAllocations.map(({ userId, heatId }) => ({ userId, heatId })));

    // Create new
    await this.riderAllocationService.createMany(createRiderAllocations);

    return competition;
  }
}
