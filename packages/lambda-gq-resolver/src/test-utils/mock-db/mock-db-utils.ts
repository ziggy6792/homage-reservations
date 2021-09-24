import Competition from 'src/domain/models/competition';
import Event from 'src/domain/models/event';
import Heat from 'src/domain/models/heat';
import RiderAllocation from 'src/domain/models/rider-allocation';
import Round from 'src/domain/models/round';
import BatchWriteRequest from 'src/utils/dynamo-easy/batch-write-request';
import _ from 'lodash';
import { BATCH_WRITE_MAX_REQUEST_ITEM_COUNT } from '@shiftcoders/dynamo-easy';
import User from 'src/domain/models/user';
import ScheduleItem from 'src/domain/models/schedule-item';
import RiderRegistration from 'src/domain/models/rider-registration';
import { IMockDb } from './types';

const mockDbTables = {
  events: Event,
  users: User,
  competitions: Competition,
  rounds: Round,
  heats: Heat,
  riderAllocations: RiderAllocation,
  riderRegistrations: RiderRegistration,
  scheduleItems: ScheduleItem,
};

const populateDb = async (mockDb: IMockDb): Promise<void> => {
  const putFns = Object.keys(mockDb).map((key: keyof IMockDb) => {
    const inputItems = mockDb[key];
    const dbItems = inputItems.map((inputItem) => Object.assign(new mockDbTables[key](), inputItem));
    return async () => Promise.all([...new BatchWriteRequest().putChunks(_.chunk(dbItems, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec())]);
  });
  const updatedEntities = await Promise.all(putFns.map((fn) => fn()));
};

const dbToJson = async () => {
  // const retJson: IMockDb = {};
  // const scanFns = Object.keys(mockDbTables).map((key: keyof typeof mockDbTables) => async () => {
  //   retJson[key] = await mockDbTables[key].store.scan().execFetchAll();
  // });
  // await Promise.all(scanFns.map((fn) => fn()));
  // return retJson;
  throw new Error('Not implemented');
};

const mockDbUtils = {
  populateDb,
  dbToJson,
};

export default mockDbUtils;
