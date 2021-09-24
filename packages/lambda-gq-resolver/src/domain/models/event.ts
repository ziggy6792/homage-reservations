import { commonConfig } from '@alpaca-backend/common';
import { Field, ObjectType, registerEnumType } from 'type-graphql';
import DataEntity from 'src/domain/interfaces/data-entity';
import * as utils from 'src/utils/utility';
import { Model, Property } from '@shiftcoders/dynamo-easy';
import Identifiable from 'src/domain/interfaces/identifiable';
import Creatable from 'src/domain/interfaces/creatable';
import dateMapper from 'src/utils/dynamo-easy/mappers/date-mapper';
import Schedule from 'src/domain/interfaces/schedule';
import _ from 'lodash';

export enum EventStatus {
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  FINALIZED = 'FINALIZED',
}

registerEnumType(EventStatus, {
  name: 'EventStatus', // this one is mandatory
  description: 'The Event Status', // this one is optional
});

const tableSchema = commonConfig.DB_SCHEMA.Event;

@ObjectType({ implements: [DataEntity, Identifiable, Creatable, Schedule] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class Event extends Schedule {
  constructor() {
    super();
    this.status = EventStatus.REGISTRATION_CLOSED;
  }

  @Field({ nullable: true })
  description: string;

  @Field({ nullable: true })
  @Property({ mapper: dateMapper })
  startTime: Date;

  @Field(() => EventStatus)
  status: EventStatus;

  @Field()
  adminUserId: string;

  @Field({ nullable: true })
  selectedHeatId: string;
}

export default Event;
