/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { commonConfig } from '@alpaca-backend/common';
import { Field, ObjectType, ID, Int } from 'type-graphql';
import Creatable from 'src/domain/interfaces/creatable';
import { GSIPartitionKey, Model, PartitionKey, SortKey } from '@shiftcoders/dynamo-easy';
import * as utils from 'src/utils/utility';

const tableSchema = commonConfig.DB_SCHEMA.RiderRegistration;

@ObjectType({ implements: [Creatable] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class RiderRegistration extends Creatable {
  @Field(() => ID)
  @PartitionKey()
  @GSIPartitionKey(tableSchema.indexes.byCompetition.indexName)
  competitionId: string;

  @Field(() => ID)
  @SortKey()
  userId: string;

  @Field(() => Int)
  startSeed: number;
}

export default RiderRegistration;
