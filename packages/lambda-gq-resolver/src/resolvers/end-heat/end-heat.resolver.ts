/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */

import { Resolver, ID, Mutation, Arg, UseMiddleware, Ctx, createUnionType } from 'type-graphql';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { isHeatIdJudge } from 'src/middleware/auth-check/is-heat-judge';
import Competition from 'src/domain/models/competition';
import { IContext } from 'src/typegraphql-setup/context';
import RiderAllocation from 'src/domain/models/rider-allocation';
import _ from 'lodash';
import { ValidationItem, ValidationItemMessage, ValidationItemType } from 'src/domain/objects/validation/validation-item';
import ValidationItemList from 'src/domain/objects/validation/validation-item-list';
import { Service } from 'typedi';
import { BatchCreatableService, CompetitionService, EventService, HeatService, RiderAllocationService, RoundService } from 'src/services';

const EndHeatResult = createUnionType({
  name: 'EndHeatResult', // the name of the GraphQL union
  types: () => [Competition, ValidationItemList] as const, // function that returns tuple of object types classes
});

@Service()
@Resolver()
export default class EndHeatResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly riderAllocationService: RiderAllocationService,
    private readonly competitionService: CompetitionService,
    private readonly batchCreatableService: BatchCreatableService,
    private readonly heatService: HeatService,
    private readonly roundService: RoundService
  ) {}

  @Mutation(() => EndHeatResult)
  @UseMiddleware([createAuthMiddleware([isHeatIdJudge])])
  async endHeat(
    @Arg('id', () => ID, { nullable: true }) heatId: string,
    @Arg('validationLevel', () => ValidationItemType, { nullable: true, defaultValue: ValidationItemType.WARN }) validationLevel: ValidationItemType
  ): Promise<Competition | ValidationItemList> {
    const validationItemList = new ValidationItemList(validationLevel);

    // Validate

    const heat = await this.heatService.getOne(heatId);

    const riderAllocations = await this.riderAllocationService.getSortedRiderAllocationsByHeatId(heatId);

    const firstUnscoredRunIndex = riderAllocations.findIndex((ra) => ra.getBestScore() < 0);

    if (firstUnscoredRunIndex > 0) {
      // Must clear or add more
      validationItemList.addValidationItem(ValidationItem.CreateErrorInstance(ValidationItemMessage.ENDHEAT_NOTREADY));
    }
    if (validationItemList.shouldAddWanings()) {
      if (firstUnscoredRunIndex === 0) {
        validationItemList.addValidationItem(ValidationItem.CreateWarnInstance(ValidationItemMessage.ENDHEAT_CANCEL));
      } else if (riderAllocations.find((ra) => ra.runs.find((run) => !_.identity(run.score)))) {
        validationItemList.addValidationItem(ValidationItem.CreateWarnInstance(ValidationItemMessage.ENDHEAT_NOTFULLYSCORED));
      }
    }

    if (!validationItemList.isEmpty()) {
      return validationItemList;
    }

    // End Heat

    const round = await this.roundService.getOne(heat.roundId);
    const competition = await this.competitionService.getOne(round.competitionId);
    const event = await this.eventService.getOne(competition.eventId);

    if (firstUnscoredRunIndex !== 0) {
      // If there are scores
      const rasToCreate: RiderAllocation[] = [];

      riderAllocations.forEach((ra, i) => {
        const seedSlot = heat.seedSlots[i];
        if (seedSlot.nextHeatId) {
          const nextRA = new RiderAllocation();
          nextRA.previousHeatId = heat.id;
          nextRA.userId = ra.userId;
          nextRA.heatId = seedSlot.nextHeatId;
          nextRA.startSeed = seedSlot.seed;
          nextRA.initRuns();
          rasToCreate.push(nextRA);
        }
      });
      await this.heatService.updateOne({ id: heatId, isFinished: true });

      await this.batchCreatableService.batchCreate(rasToCreate);
    } else {
      // Clear selected heat
      event.selectedHeatId = null;
      this.eventService.updateOne(event);
    }

    return competition;
  }
}
