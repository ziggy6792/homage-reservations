/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */
import { Field, InputType, ID, Int } from 'type-graphql';

@InputType()
class RiderRegistrationInput {
  @Field(() => ID)
  competitionId: string;

  @Field(() => ID, { nullable: true })
  userId: string;
}

@InputType()
export class CreateRiderRegistratiionInput extends RiderRegistrationInput {
  @Field(() => Int, { nullable: true })
  startSeed: number;
}

@InputType()
export class UpdateRiderRegistrationInput extends RiderRegistrationInput {
  @Field(() => Int)
  startSeed: number;
}

@InputType()
export class DeleteRiderRegistrationInput extends RiderRegistrationInput {}
