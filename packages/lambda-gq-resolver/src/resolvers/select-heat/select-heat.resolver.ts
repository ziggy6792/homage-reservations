/* eslint-disable no-useless-constructor */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */

import { Resolver, ID, Mutation, Arg, Ctx, UseMiddleware, createUnionType, ObjectType, Field } from 'type-graphql';
import { IContext } from 'src/typegraphql-setup/context';
import Event from 'src/domain/models/event';
import Heat, { HeatStatus } from 'src/domain/models/heat';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { isHeatIdJudge } from 'src/middleware/auth-check/is-heat-judge';
import { ValidationItem, ValidationItemBase, ValidationItemMessage, ValidationItemType } from 'src/domain/objects/validation/validation-item';
import RiderAllocation from 'src/domain/models/rider-allocation';
import BatchWriteRequest from 'src/utils/dynamo-easy/batch-write-request';
import { BATCH_WRITE_MAX_REQUEST_ITEM_COUNT } from '@shiftcoders/dynamo-easy';
import _ from 'lodash';
import ValidationItemList from 'src/domain/objects/validation/validation-item-list';
import { Service } from 'typedi';
import { BatchCreatableService, CompetitionService, EventService, HeatService, RiderAllocationService, RoundService } from 'src/services';

const SelectHeatResult = createUnionType({
  name: 'SelectHeatResult', // the name of the GraphQL union
  types: () => [Event, ValidationItemList] as const, // function that returns tuple of object types classes
});

@ObjectType({ implements: [ValidationItemBase] })
class ValidationItemHeatAlreadyOpen extends ValidationItemBase {
  @Field(() => ID)
  eventId: string;

  constructor(eventId: string) {
    super(ValidationItemType.ERROR, ValidationItemMessage.OPENHEAT_ALREADYOPEN);
    this.eventId = eventId;
  }

  static CreateErrorInstance(eventId: string): ValidationItem {
    return new ValidationItemHeatAlreadyOpen(eventId);
  }
}

@Service()
@Resolver()
export default class SelectHeatResolver {
  constructor(
    private readonly eventService: EventService,
    private readonly riderAllocationService: RiderAllocationService,
    private readonly batchCreatableService: BatchCreatableService,
    private readonly roundService: RoundService,
    private readonly competitionService: CompetitionService,
    private readonly heatService: HeatService
  ) {}

  @Mutation(() => SelectHeatResult)
  @UseMiddleware([createAuthMiddleware([isHeatIdJudge])])
  async selectHeat(
    @Arg('id', () => ID) heatId: string,
    @Arg('validationLevel', () => ValidationItemType, { nullable: true, defaultValue: ValidationItemType.WARN }) validationLevel: ValidationItemType
  ): Promise<Event | ValidationItemList> {
    const heat = await this.heatService.getOne(heatId);

    const event = await this.eventService.getEventByHeatId(heatId);

    // Validate

    const validationItemList = new ValidationItemList(validationLevel);

    const eventSelectedHeat = await this.heatService.getOne(event.selectedHeatId);

    // IF this heat is not selected and the actual selected heat is selected and not finished
    if (eventSelectedHeat && eventSelectedHeat?.id !== heat.id && !eventSelectedHeat.isFinished) {
      const selectetRound = await this.roundService.getOne(eventSelectedHeat.roundId);
      const selectetComp = await this.competitionService.getOne(selectetRound.competitionId);
      // ToDo: the conflicting heat. a bit overkill for now
      // const fullHeatName = [selectetComp.name, selectetRound.getRoundName(), eventSelectedHeat.name].join(' - ');
      validationItemList.addValidationItem(ValidationItemHeatAlreadyOpen.CreateErrorInstance(selectetComp.eventId));
    }

    // const noAllocated = await heat.getNoAllocated();
    // const noProgressing = await heat.getNoProgressing(ctx);

    const noAllocated = await this.heatService.getNoAllocated(heat);
    const noProgressing = await this.heatService.getNoProgressing(heat);

    if (noAllocated === 0) {
      validationItemList.addValidationItem(ValidationItem.CreateErrorInstance(ValidationItemMessage.OPENHEAT_NORIDERS));
    } else if (noAllocated < noProgressing) {
      validationItemList.addValidationItem(ValidationItem.CreateErrorInstance(ValidationItemMessage.OPENHEAT_TOOFEWRIDERS));
    } else if ((await this.heatService.getStatus(heat)) === HeatStatus.NOT_READY) {
      validationItemList.addValidationItem(ValidationItem.CreateErrorInstance(ValidationItemMessage.OPENHEAT_NOTREADY));
    }

    if (validationItemList.shouldAddWanings()) {
      if ((await this.heatService.getStatus(heat)) === HeatStatus.FINISHED) {
        validationItemList.addValidationItem(ValidationItem.CreateWarnInstance(ValidationItemMessage.OPENHEAT_ALREADYFINISHED));
      }
      if (noAllocated >= noProgressing && noAllocated < heat.getSize()) {
        validationItemList.addValidationItem(ValidationItem.CreateWarnInstance(ValidationItemMessage.OPENHEAT_NOTFULL));
      }
    }

    if (!validationItemList.isEmpty()) {
      return validationItemList;
    }

    // Select Heat

    // ToDo query index would be faster
    // Delete all allocations that were created then this head was closed
    // const riderAllocationsToDelete = await RiderAllocation.store.scan().whereAttribute('previousHeatId').eq(heat.id).execFetchAll();
    const riderAllocationsToDelete = await this.riderAllocationService.getRiderAllocationsPreviousHeatId(heat.id);

    await this.batchCreatableService.batchDelete(riderAllocationsToDelete);

    await this.heatService.updateOne({ id: heatId, isFinished: false });
    return this.eventService.updateOne({ id: event.id, selectedHeatId: heatId });
  }
}
