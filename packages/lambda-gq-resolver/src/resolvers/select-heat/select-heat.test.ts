/* eslint-disable no-return-await */
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import * as mockDb from '@test-utils/mock-db';
import mockDbUtils from '@test-utils/mock-db/mock-db-utils';
import _ from 'lodash';

beforeAll(async () => {
  await testConn();
});

const selectHaatMutation = `mutation selectHeat($id: ID!) {
    selectHeat(id: $id) {     
      ... on Event { 
        selectedHeat{
          status
          id
        }
      }
    }
  }
  `;

describe('Select heat', () => {
  it('Select heat', async () => {
    await mockDbUtils.populateDb(mockDb.competitionPreScoreRuns);

    const response = await gCall({
      source: selectHaatMutation,
      variableValues: {
        id: 'heat1',
      },
    });

    expect(response).toMatchObject({ data: { selectHeat: { selectedHeat: { status: 'SELECTED_IN_PROGRESS', id: 'heat1' } } } });
  });
});
