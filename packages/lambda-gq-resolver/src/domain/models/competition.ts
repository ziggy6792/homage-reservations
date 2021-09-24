/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { commonConfig } from '@alpaca-backend/common';
import { Field, ObjectType, registerEnumType, ID, Int } from 'type-graphql';
import DataEntity from 'src/domain/interfaces/data-entity';
import * as utils from 'src/utils/utility';
import { GSIPartitionKey, Model, Property } from '@shiftcoders/dynamo-easy';
import Creatable from 'src/domain/interfaces/creatable';
import Identifiable from 'src/domain/interfaces/identifiable';
import Schedule from 'src/domain/interfaces/schedule';
import _ from 'lodash';

export enum CompetitionStatus {
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  FINISHED = 'FINISHED',
}

export enum Gender {
  ANY = 'ANY',
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Sport {
  WAKEBOARD = 'WAKEBOARD',
  WAKESKATE = 'WAKESKATE',
}

export enum Level {
  ANY = 'ANY',
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL',
}

registerEnumType(CompetitionStatus, {
  name: 'CompetitionStatus', // this one is mandatory
  description: 'The Competition Status', // this one is optional
});

registerEnumType(Gender, {
  name: 'Gender', // this one is mandatory
  description: 'Gender', // this one is optional
});

registerEnumType(Sport, {
  name: 'Sport', // this one is mandatory
  description: 'Sport', // this one is optional
});

registerEnumType(Level, {
  name: 'Level', // this one is mandatory
  description: 'Level', // this one is optional
});

@ObjectType()
@Model()
export class CompetitionParams {
  @Field()
  name: string;
}

const tableSchema = commonConfig.DB_SCHEMA.Competition;

@ObjectType({ implements: [DataEntity, Identifiable, Creatable, Schedule] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class Competition extends Schedule {
  constructor() {
    super();
    this.params = new CompetitionParams();
  }

  @Field()
  description: string;

  @Field()
  category: string;

  @Field(() => ID)
  @Property()
  @GSIPartitionKey(tableSchema.indexes.byEvent.indexName)
  eventId: string;

  @Field(() => ID)
  judgeUserId: string;

  @Field(() => CompetitionParams)
  params: CompetitionParams;

  @Field(() => Boolean)
  isRegistrationClosed: boolean;

  @Field(() => Int, { nullable: true })
  maxRiders: number;

  @Field(() => Gender)
  gender: Gender;

  @Field(() => Sport)
  sport: Sport;

  @Field(() => Level)
  level: Level;
}

export default Competition;
