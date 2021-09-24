/* eslint-disable no-return-await */
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import * as mockDb from '@test-utils/mock-db';
import mockDbUtils from '@test-utils/mock-db/mock-db-utils';

beforeAll(async () => {
  await testConn();
});

const allocateMutation = `mutation allocateRiders($id: ID!) {
    allocateRiders(id: $id) {
      id
      rounds {
        items {
          id
          heats {
            items {
              name
              riderAllocations {
                items {
                  userId
                  startSeed
                }
              }
            }
          }
        }
      }
    }
  }`;

const expectedFirstRoundResult = {
  id: 'round1Upper',
  heats: {
    items: [
      {
        name: 'Heat 1',
        riderAllocations: {
          items: [
            {
              userId: 'riderA',
              startSeed: 1,
            },
            {
              userId: 'riderE',
              startSeed: 5,
            },
            {
              userId: 'riderI',
              startSeed: 9,
            },
            {
              userId: 'riderM',
              startSeed: 13,
            },
            {
              userId: 'riderQ',
              startSeed: 17,
            },
            {
              userId: 'riderU',
              startSeed: 21,
            },
          ],
        },
      },
      {
        name: 'Heat 2',
        riderAllocations: {
          items: [
            {
              userId: 'riderC',
              startSeed: 3,
            },
            {
              userId: 'riderG',
              startSeed: 7,
            },
            {
              userId: 'riderK',
              startSeed: 11,
            },
            {
              userId: 'riderO',
              startSeed: 15,
            },
            {
              userId: 'riderS',
              startSeed: 19,
            },
            {
              userId: 'riderW',
              startSeed: 23,
            },
          ],
        },
      },
      {
        name: 'Heat 3',
        riderAllocations: {
          items: [
            {
              userId: 'riderB',
              startSeed: 2,
            },
            {
              userId: 'riderF',
              startSeed: 6,
            },
            {
              userId: 'riderJ',
              startSeed: 10,
            },
            {
              userId: 'riderN',
              startSeed: 14,
            },
            {
              userId: 'riderR',
              startSeed: 18,
            },

            {
              userId: 'riderV',
              startSeed: 22,
            },
          ],
        },
      },
      {
        name: 'Heat 4',
        riderAllocations: {
          items: [
            {
              userId: 'riderD',
              startSeed: 4,
            },
            {
              userId: 'riderH',
              startSeed: 8,
            },
            {
              userId: 'riderL',
              startSeed: 12,
            },
            {
              userId: 'riderP',
              startSeed: 16,
            },
            {
              userId: 'riderT',
              startSeed: 20,
            },
            {
              userId: 'riderX',
              startSeed: 24,
            },
          ],
        },
      },
    ],
  },
};

describe('AllocateRiders', () => {
  it('allocateRiders', async () => {
    await mockDbUtils.populateDb(mockDb.competitionPreRiderAllocation);

    const response = await gCall({
      source: allocateMutation,
      variableValues: {
        id: 'testCompetition',
      },
    });

    const firstRoundResponse = response.data.allocateRiders.rounds.items[0];
    expect(firstRoundResponse).toMatchObject(expectedFirstRoundResult);
  });
});
