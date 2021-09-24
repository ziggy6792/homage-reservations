/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */

import { Resolver, Mutation, Arg, ID, UseMiddleware } from 'type-graphql';
import _ from 'lodash';
import Round from 'src/domain/models/round';
import Heat, { SeedSlot } from 'src/domain/models/heat';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import Competition from 'src/domain/models/competition';
import isCompetitionAdmin from 'src/middleware/auth-check/is-comp-admin';
import ScheduleItem from 'src/domain/models/schedule-item';
import { Service } from 'typedi';
import { BatchCreatableService, CompetitionService, RiderRegistrationService } from 'src/services';
import { CompetitionParamsInput } from 'src/inputs';

@Service()
@Resolver()
export default class BuildCompetition {
  constructor(
    private readonly competitionService: CompetitionService,
    private readonly riderRegistrationService: RiderRegistrationService,
    private readonly batchCreatableService: BatchCreatableService
  ) {}

  @Mutation(() => Competition, { nullable: true })
  @UseMiddleware([createAuthMiddleware([isCompetitionAdmin])])
  async buildCompetition(@Arg('id', () => ID) id: string, @Arg('params', () => CompetitionParamsInput) params: CompetitionParamsInput): Promise<Competition> {
    const start = new Date().getTime();

    const competition = await this.competitionService.getOne(id);

    const deleteDecendents = await this.riderRegistrationService.getDescendantsDeleteFn(competition);

    params.rounds = _.orderBy(params.rounds, ['roundNo', 'type'], ['asc', 'asc']);

    const roundsToCreate: Round[] = [];
    const heatsToCreate: Heat[] = [];
    const allSeedSlots: SeedSlot[] = [];

    // Maps created seedslots back to their parent heats
    const heatMap: Map<SeedSlot, Heat> = new Map();

    _.orderBy(params.rounds, ({ roundNo, type }) => [roundNo, type]).forEach((roundParam) => {
      const { heats: heatParams, ...roundInput } = roundParam;
      const round = Object.assign(new Round(), roundInput);
      roundsToCreate.push(round);
      heatParams.forEach((heatParam) => {
        const { seedSlots: seedSlotParams, ...heatInput } = heatParam;
        const heat = Object.assign(new Heat(), heatInput);
        heatsToCreate.push(heat);
        _.orderBy(seedSlotParams, ({ seed }) => seed).forEach((seedSlotParam) => {
          const seedSlot = new SeedSlot();
          seedSlot.seed = seedSlotParam.seed;
          heat.seedSlots.push(seedSlot);
          heatMap.set(seedSlot, heat);
          allSeedSlots.push(seedSlot);
        });
        heat.roundId = round.id;
      });
      round.competitionId = competition.id;
    });

    const seedsHolder: { [key in string]: SeedSlot } = {};

    // allSeedSlots is orderd from earliest to latest riding order
    allSeedSlots.forEach((seedSlot) => {
      // If I have seen this seed already
      if (seedsHolder[seedSlot.seed]) {
        if (!seedSlot.nextHeatId) {
          const previousSeedSlot = seedsHolder[seedSlot.seed];
          const previousHeat = heatMap.get(previousSeedSlot);
          seedSlot.previousHeatId = previousHeat.id; // Set that one as my parent
          previousSeedSlot.nextHeatId = heatMap.get(seedSlot).id;
        }
      }
      seedsHolder[seedSlot.seed] = seedSlot; // Now keep track of this one
    });

    const scheduleItemsToCreate = roundsToCreate.map((round, i) => {
      const scheduleItem = new ScheduleItem();
      scheduleItem.scheduleId = competition.id;
      scheduleItem.schedulableId = round.id;
      // scheduleItem.startTime = addDays(new Date(), i);
      return scheduleItem;
    });

    await deleteDecendents();

    await this.batchCreatableService.batchCreate([...heatsToCreate, ...roundsToCreate, ...scheduleItemsToCreate]);

    const end = new Date().getTime();

    console.log(`took ${end - start}`);

    return competition;
  }
}
