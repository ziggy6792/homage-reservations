/* eslint-disable no-return-await */
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import * as mockDb from '@test-utils/mock-db';
import mockDbUtils from '@test-utils/mock-db/mock-db-utils';

beforeAll(async () => {
  await testConn();
});

describe('Create Rirder Registrations', () => {
  it('createRiderRegistrations', async () => {
    // ToDo write this test
    await mockDbUtils.populateDb(mockDb.competitionPreRiderAllocation);

    // const response = await gCall({
    //     source: allocateMutation,
    //     variableValues: {
    //         id: 'testCompetition',
    //     },
    // });

    // const firstRoundResponse = response.data.allocateRiders.rounds.items[0];
    // expect(firstRoundResponse).toMatchObject(expectedFirstRoundResult);
  });
});
