/* eslint-disable max-classes-per-file */
// import createListObject from 'src/domain/common-objects/higher-order-objects/create-list-object';
import { Field, ObjectType } from 'type-graphql';
import RiderAllocation from 'src/domain/models/rider-allocation';
import Competition from 'src/domain/models/competition';
import Round from 'src/domain/models/round';
import Heat from 'src/domain/models/heat';
import ScheduleItem from 'src/domain/models/schedule-item';
import RiderRegistration from 'src/domain/models/rider-registration';
import RiderRank from './rider-rank';

export class AbstractList {
  items: any[];

  constructor(items?: any[]) {
    this.items = items || [];
  }
}

@ObjectType()
export class CompetitionList extends AbstractList {
  @Field(() => [Competition])
  items: Competition[];
}

@ObjectType()
export class RiderAllocationList extends AbstractList {
  @Field(() => [RiderAllocation])
  items: RiderAllocation[];
}

@ObjectType()
export class RiderRegistrationList extends AbstractList {
  @Field(() => [RiderRegistration])
  items: RiderRegistration[];
}

@ObjectType()
export class RoundList extends AbstractList {
  @Field(() => [Round])
  items: Array<Round>;
}

@ObjectType()
export class ScheduleItemList extends AbstractList {
  @Field(() => [ScheduleItem])
  items: Array<ScheduleItem>;
}

@ObjectType()
export class HeatList extends AbstractList {
  @Field(() => [Heat])
  items: Array<Heat>;
}

@ObjectType()
export class RiderRankList extends AbstractList {
  @Field(() => [RiderRank])
  items: Array<RiderRank>;
}
