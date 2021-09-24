/* eslint-disable no-return-await */
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import * as mockDb from '@test-utils/mock-db';
import mockDbUtils from '@test-utils/mock-db/mock-db-utils';
import _ from 'lodash';

beforeAll(async () => {
  await testConn();
});

const endHeatMutation = `mutation endHeat($id: ID!) {
    endHeat(id: $id, validationLevel: ERROR) {
      ... on Competition {
        id
      }
      ... on ValidationItemList {
        items {
          message
          type
        }
      }
    }
  }`;

const getCompetitionQuery = `query getCompetition {
    getCompetition(id: "testCompetition") {
      rounds {
        items {
          heats {
            items {
              name
              status
              riderAllocations {
                items {
                  userId
                  position
                  startSeed
                  runs {
                    score
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  `;

const expectedRound1 = {
  heats: {
    items: [
      {
        name: 'Heat 1',
        status: 'SELECTED_FINISHED',
      },
      {
        name: 'Heat 2',
        status: 'FINISHED',
      },
      {
        name: 'Heat 3',
        status: 'FINISHED',
      },
      {
        name: 'Heat 4',
        status: 'FINISHED',
      },
    ],
  },
};

const expectedLCQs = {
  heats: {
    items: [
      {
        name: 'LCQ 1',
        riderAllocations: {
          items: [
            { userId: 'riderU', position: null, startSeed: 9 },
            { userId: 'riderC', position: null, startSeed: 11 },
            { userId: 'riderM', position: null, startSeed: 13 },
            { userId: 'riderO', position: null, startSeed: 15 },
            { userId: 'riderA', position: null, startSeed: 17 },
            { userId: 'riderS', position: null, startSeed: 19 },
            { userId: 'riderI', position: null, startSeed: 21 },
            { userId: 'riderG', position: null, startSeed: 23 },
          ],
        },
      },
      {
        name: 'LCQ 2',
        riderAllocations: {
          items: [
            { userId: 'riderF', position: null, startSeed: 10 },
            { userId: 'riderP', position: null, startSeed: 12 },
            { userId: 'riderR', position: null, startSeed: 14 },
            { userId: 'riderD', position: null, startSeed: 16 },
            { userId: 'riderV', position: null, startSeed: 18 },
            { userId: 'riderL', position: null, startSeed: 20 },
            { userId: 'riderN', position: null, startSeed: 22 },
            { userId: 'riderT', position: null, startSeed: 24 },
          ],
        },
      },
    ],
  },
};

const expectedSemiFinals = {
  heats: {
    items: [
      {
        name: 'SF 1',
        riderAllocations: {
          items: [
            { userId: 'riderQ', position: null, startSeed: 1 },
            { userId: 'riderK', position: null, startSeed: 3 },
            { userId: 'riderE', position: null, startSeed: 5 },
            { userId: 'riderW', position: null, startSeed: 7 },
          ],
        },
      },
      {
        name: 'SF 2',
        riderAllocations: {
          items: [
            { userId: 'riderB', position: null, startSeed: 2 },
            { userId: 'riderX', position: null, startSeed: 4 },
            { userId: 'riderJ', position: null, startSeed: 6 },
            { userId: 'riderH', position: null, startSeed: 8 },
          ],
        },
      },
    ],
  },
};

describe('End Heat', () => {
  it('End heat', async () => {
    await mockDbUtils.populateDb(mockDb.competitionPreEndHeat);

    const endHeatFns = ['heat1', 'heat2', 'heat3', 'heat4'].map((heatId) => async () =>
      await gCall({
        source: endHeatMutation,
        variableValues: {
          id: heatId,
          validationLevel: 'ERROR',
        },
      })
    );
    const results = await Promise.all(endHeatFns.map((fn) => fn()));

    console.log(JSON.stringify(results[0]));

    const response = await gCall({
      source: getCompetitionQuery,
      variableValues: {
        id: 'testCompetition',
      },
    });

    // console.log(JSON.stringify(response.data.getCompetition.rounds.items[0]));

    expect(response.data.getCompetition.rounds.items[0]).toMatchObject(expectedRound1);
    expect(response.data.getCompetition.rounds.items[1]).toMatchObject(expectedLCQs);
    expect(response.data.getCompetition.rounds.items[2]).toMatchObject(expectedSemiFinals);
  });
});
