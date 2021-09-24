/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Field, ObjectType, ID } from 'type-graphql';
import Creatable from 'src/domain/interfaces/creatable';
import { commonConfig } from '@alpaca-backend/common';
import { GSIPartitionKey, Model, Property } from '@shiftcoders/dynamo-easy';
import * as utils from 'src/utils/utility';
import dateMapper from 'src/utils/dynamo-easy/mappers/date-mapper';
import Identifiable from 'src/domain/interfaces/identifiable';

const tableSchema = commonConfig.DB_SCHEMA.ScheduleItem;

@ObjectType({ implements: [Identifiable, Creatable] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class ScheduleItem extends Identifiable {
  @Field(() => ID)
  @GSIPartitionKey(tableSchema.indexes.bySchedule.indexName)
  scheduleId: string;

  @Field(() => ID)
  @GSIPartitionKey(tableSchema.indexes.bySchedulable.indexName)
  schedulableId: string;

  @Field({ nullable: true })
  @GSIPartitionKey(tableSchema.indexes.byStartTime.indexName)
  @Property({ mapper: dateMapper, defaultValueProvider: () => new Date(0) })
  startTime: Date;

  @Field(() => String, { nullable: true })
  notice: string;
}

export default ScheduleItem;
