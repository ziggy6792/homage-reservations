/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import { Field, ObjectType, registerEnumType, ID, Int } from 'type-graphql';
import DataEntity from 'src/domain/interfaces/data-entity';
import { commonConfig } from '@alpaca-backend/common';
import * as utils from 'src/utils/utility';
import { GSIPartitionKey, Model } from '@shiftcoders/dynamo-easy';
import Identifiable from 'src/domain/interfaces/identifiable';
import Creatable from 'src/domain/interfaces/creatable';

export enum HeatStatus {
  NOT_READY = 'NOT_READY',
  READY = 'READY',
  SELECTED_IN_PROGRESS = 'SELECTED_IN_PROGRESS',
  SELECTED_FINISHED = 'SELECTED_FINISHED',
  FINISHED = 'FINISHED',
}

registerEnumType(HeatStatus, {
  name: 'HeatStatus', // this one is mandatory
});

const tableSchema = commonConfig.DB_SCHEMA.Heat;

@ObjectType()
@Model()
export class SeedSlot {
  @Field(() => Int)
  seed: number;

  @Field(() => ID, { nullable: true })
  nextHeatId: string;

  @Field(() => ID, { nullable: true })
  previousHeatId: string;
}

@ObjectType({ implements: [DataEntity, Identifiable, Creatable] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class Heat extends DataEntity {
  constructor() {
    super();
    this.seedSlots = [];
  }

  mapIn(loadedValues: any): void {
    super.mapIn(loadedValues);
    this.seedSlots = this.seedSlots.map((seedSlot) => _.merge(new SeedSlot(), seedSlot));
  }

  @Field(() => ID)
  @GSIPartitionKey(tableSchema.indexes.byRound.indexName)
  roundId: string;

  @Field(() => Int)
  progressionsPerHeat: number;

  @Field(() => Boolean)
  isFinished: boolean;

  @Field(() => [SeedSlot])
  seedSlots: SeedSlot[];

  @Field(() => Int, { name: 'size' })
  getSize(): number {
    return this.seedSlots.length;
  }

  @Field(() => Boolean, { name: 'isFinal' })
  getIsFinal(): boolean {
    return !this.seedSlots[0].nextHeatId;
  }
}

export default Heat;
