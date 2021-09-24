/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */
import { HeatStatus } from 'src/domain/models/heat';
import { RoundType } from 'src/domain/models/round';
import { Field, InputType, Int } from 'type-graphql';

@InputType()
export class SignUpRiderInput {
  @Field()
  firstName: string;

  @Field()
  lastName: HeatStatus;
}
