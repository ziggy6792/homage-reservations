/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */

import { applyDefaults, createGSI, createTableSchema } from './db-schema-helper';
import { IAttributeType } from './types';

const DB_SCHEMA_CONFIG = {
  User: createTableSchema({
    indexes: {
      byLastName: createGSI({
        partitionKey: { name: '__typename', type: IAttributeType.STRING },
        sortKey: { name: 'lastName', type: IAttributeType.STRING },
      }),
    },
  }),
  Round: createTableSchema({
    indexes: {
      byCompetition: createGSI({
        partitionKey: { name: 'competitionId', type: IAttributeType.STRING },
        sortKey: { name: 'createdAt', type: IAttributeType.STRING },
      }),
    },
  }),
  RiderAllocation: createTableSchema({
    partitionKey: { name: 'heatId', type: IAttributeType.STRING },
    sortKey: { name: 'userId', type: IAttributeType.STRING },
    indexes: {
      byHeat: createGSI({
        partitionKey: { name: 'heatId', type: IAttributeType.STRING },
        sortKey: { name: 'startSeed', type: IAttributeType.NUMBER },
      }),
    },
  }),
  RiderRegistration: createTableSchema({
    partitionKey: { name: 'competitionId', type: IAttributeType.STRING },
    sortKey: { name: 'userId', type: IAttributeType.STRING },
    indexes: {
      byCompetition: createGSI({
        partitionKey: { name: 'competitionId', type: IAttributeType.STRING },
        sortKey: { name: 'startSeed', type: IAttributeType.NUMBER },
      }),
    },
  }),
  Heat: createTableSchema({
    indexes: {
      byRound: createGSI({
        partitionKey: { name: 'roundId', type: IAttributeType.STRING },
        sortKey: { name: 'createdAt', type: IAttributeType.STRING },
      }),
    },
  }),
  Event: createTableSchema({}),
  Competition: createTableSchema({
    indexes: {
      byEvent: createGSI({
        partitionKey: { name: 'eventId', type: IAttributeType.STRING },
        sortKey: { name: 'createdAt', type: IAttributeType.STRING },
      }),
    },
  }),
  ScheduleItem: createTableSchema({
    indexes: {
      bySchedulable: createGSI({
        partitionKey: { name: 'schedulableId', type: IAttributeType.STRING },
        sortKey: { name: 'startTime', type: IAttributeType.STRING },
      }),
      bySchedule: createGSI({
        partitionKey: { name: 'scheduleId', type: IAttributeType.STRING },
        sortKey: { name: 'startTime', type: IAttributeType.STRING },
      }),
      byStartTime: createGSI({
        partitionKey: { name: '__typename', type: IAttributeType.STRING },
        sortKey: { name: 'startTime', type: IAttributeType.STRING },
      }),
    },
  }),
};

export const DB_SCHEMA = applyDefaults(DB_SCHEMA_CONFIG);
