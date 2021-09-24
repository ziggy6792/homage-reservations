/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Field, ObjectType, registerEnumType, Int, ID } from 'type-graphql';
import Identifiable from 'src/domain/interfaces/identifiable';
import * as utils from 'src/utils/utility';
import { commonConfig } from '@alpaca-backend/common';
import { GSIPartitionKey, Model } from '@shiftcoders/dynamo-easy';
import Creatable from 'src/domain/interfaces/creatable';
import DataEntity from 'src/domain/interfaces/data-entity';
import Schedulable from 'src/domain/interfaces/schedulable';

export enum RoundType {
  UPPER = 'UPPER',
  LOWER = 'LOWER',
}

registerEnumType(RoundType, {
  name: 'RoundType', // this one is mandatory
  description: 'The Round Type', // this one is optional
});

const tableSchema = commonConfig.DB_SCHEMA.Round;

@ObjectType({ implements: [Identifiable, Creatable, Schedulable, DataEntity] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class Round extends Schedulable {
  @Field(() => Int)
  roundNo: number;

  @Field(() => RoundType)
  type: RoundType;

  @Field(() => ID)
  @GSIPartitionKey(tableSchema.indexes.byCompetition.indexName)
  competitionId: string;

  // Has not side effects so can resolve here
  @Field(() => String, { name: 'name' })
  getName(): string {
    return `Round ${this.roundNo}${this.type === RoundType.LOWER ? ' (LCQ)' : ''}`;
  }
}

export default Round;
