/* eslint-disable max-classes-per-file */
import { Field, InputType, ID } from 'type-graphql';

@InputType()
class ScheduleItemInput {
  @Field({ nullable: true })
  startTime: Date;

  @Field(() => String, { nullable: true })
  notice: string;
}

@InputType()
export class CreateScheduleItemInput extends ScheduleItemInput {
  @Field(() => ID)
  scheduleId: string;
}

@InputType()
export class UpdateScheduleItemInput extends ScheduleItemInput {
  @Field(() => ID)
  id: string;
}
