/* eslint-disable no-await-in-loop */
/* eslint-disable no-return-await */
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import * as mockDb from '@test-utils/mock-db';
import mockDbUtils from '@test-utils/mock-db/mock-db-utils';
import _ from 'lodash';
import Heat from 'src/domain/models/heat';

import { BATCH_WRITE_MAX_REQUEST_ITEM_COUNT } from '@shiftcoders/dynamo-easy';
import BatchGetRequest from './batch-get-request';

beforeAll(async () => {
  await testConn();
});

describe('Performance', () => {
  it.skip('End heat', async () => {
    await mockDbUtils.populateDb(mockDb.competitionPreEndHeat);

    const heat = new Heat();
    heat.id = 'heat1';

    const heat2 = new Heat();
    heat.id = 'heat2';

    const dbItems = [heat, heat2];
    const heats = await Promise.all([...new BatchGetRequest().getChunks(_.chunk(dbItems, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec())]);

    console.log('heats', JSON.stringify(heats));
  });
});
