/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */
import { Property } from '@shiftcoders/dynamo-easy';
import { CompetitionStatus, Gender, Level, Sport } from 'src/domain/models/competition';
import dateMapper from 'src/utils/dynamo-easy/mappers/date-mapper';
import { Field, InputType, ID, Int } from 'type-graphql';

// @InputType()
// class CompetitionParams {
//     @Field()
//     name: string;
// }
@InputType()
class CompetitionInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  category: string;

  @Field(() => ID, { nullable: true })
  judgeUserId: string;

  @Field(() => CompetitionStatus, { nullable: true })
  status: CompetitionStatus;

  // @Field(() => CompetitionParams, { nullable: true })
  // params: CompetitionParams;

  @Field({ nullable: true })
  selectedHeatId: string;

  @Field(() => Int, { nullable: true })
  maxRiders: number;

  @Field(() => Gender, { nullable: true })
  gender: Gender;

  @Field(() => Sport, { nullable: true })
  sport: Sport;

  @Field(() => Level, { nullable: true })
  level: Level;
}

@InputType()
export class CreateCompetitionInput extends CompetitionInput {
  @Field(() => ID, { nullable: true })
  id: string;

  @Field(() => ID)
  eventId: string;
}

@InputType()
export class UpdateCompetitionInput extends CompetitionInput {
  @Field(() => ID)
  id: string;
}
