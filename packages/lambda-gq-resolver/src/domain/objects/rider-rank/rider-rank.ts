/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Field, ObjectType, Int, Ctx } from 'type-graphql';
import { Model } from '@shiftcoders/dynamo-easy';
import User from 'src/domain/models/user';
import { IContext } from 'src/typegraphql-setup/context';

@ObjectType()
@Model()
class RiderRank {
  @Field()
  userId: string;

  @Field(() => Int, { nullable: true })
  rank: number;
}

export default RiderRank;
