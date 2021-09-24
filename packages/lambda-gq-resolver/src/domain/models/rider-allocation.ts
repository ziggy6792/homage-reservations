/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { commonConfig } from '@alpaca-backend/common';
import _ from 'lodash';
import { Field, ObjectType, ID, Int, Float } from 'type-graphql';
import Creatable from 'src/domain/interfaces/creatable';
import { GSIPartitionKey, Model, PartitionKey, SortKey } from '@shiftcoders/dynamo-easy';
import * as utils from 'src/utils/utility';

@ObjectType()
@Model()
export class Run {
  @Field(() => Float, { nullable: true })
  score: number;

  @Field({ nullable: true })
  isPublic?: boolean;
}

const tableSchema = commonConfig.DB_SCHEMA.RiderAllocation;

@ObjectType({ implements: [Creatable] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class RiderAllocation extends Creatable {
  @Field(() => ID)
  @PartitionKey()
  @GSIPartitionKey(tableSchema.indexes.byHeat.indexName)
  heatId: string;

  @Field(() => ID)
  @SortKey()
  userId: string;

  @Field(() => Int)
  startSeed: number;

  @Field(() => ID)
  previousHeatId: string;

  @Field(() => [Run], { nullable: true })
  runs: Run[];

  initRuns(): void {
    this.runs = [{ score: null }];
  }

  // ToDo: Not sure if should move to service
  getBestScore(): number {
    const bestRun = _.maxBy(this.runs, 'score');
    const ret = bestRun ? bestRun.score : -1;
    return ret;
  }
}

export default RiderAllocation;
