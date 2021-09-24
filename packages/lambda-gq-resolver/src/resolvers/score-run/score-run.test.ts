/* eslint-disable no-await-in-loop */
/* eslint-disable no-return-await */
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import * as mockDb from '@test-utils/mock-db';
import mockDbUtils from '@test-utils/mock-db/mock-db-utils';
import _ from 'lodash';
import Event from 'src/domain/models/event';
import Heat from 'src/domain/models/heat';
import Container from 'typedi';
import { TEST_CONTEXT } from '@test-utils/tokens';
import { EventService, HeatService } from 'src/services';

beforeAll(async () => {
  await testConn();
});

const scoreRunMutation = `mutation scoreRun($input: ScorRunInput!) {
  scoreRun(input: $input) {
    name
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
}`;

const getCompetitionQuery = `query getCompetition($id: ID!) {
    getCompetition(id: $id) {
      rounds {
        items {
          heats {
            items {
              name
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
  }`;

const bigCompScores = {
  heat1: [
    { userId: 'riderA', runs: [{ score: 60 }, { score: 61 }] },
    { userId: 'riderE', runs: [{ score: 50 }, { score: 51 }] },
    { userId: 'riderI', runs: [{ score: 40 }, { score: 41 }] },
    { userId: 'riderM', runs: [{ score: 30 }, { score: 31 }] },
    { userId: 'riderQ', runs: [{ score: 20 }, { score: 21 }] },
    { userId: 'riderU', runs: [{ score: 10 }, { score: 11 }] },
  ],
  heat2: [
    { userId: 'riderC', runs: [{ score: 60 }, { score: 61 }] },
    { userId: 'riderG', runs: [{ score: 50 }, { score: 51 }] },
    { userId: 'riderK', runs: [{ score: 40 }, { score: 41 }] },
    { userId: 'riderO', runs: [{ score: 30 }, { score: 31 }] },
    { userId: 'riderS', runs: [{ score: 20 }, { score: 21 }] },
    { userId: 'riderW', runs: [{ score: 10 }, { score: 11 }] },
  ],
  heat3: [
    { userId: 'riderB', runs: [{ score: 60 }, { score: 61 }] },
    { userId: 'riderF', runs: [{ score: 50 }, { score: 51 }] },
    { userId: 'riderJ', runs: [{ score: 40 }, { score: 41 }] },
    { userId: 'riderN', runs: [{ score: 30 }, { score: 31 }] },
    { userId: 'riderR', runs: [{ score: 20 }, { score: 21 }] },
    { userId: 'riderV', runs: [{ score: 10 }, { score: 11 }] },
  ],
  heat4: [
    { userId: 'riderD', runs: [{ score: 60 }, { score: 61 }] },
    { userId: 'riderH', runs: [{ score: 50 }, { score: 51 }] },
    { userId: 'riderL', runs: [{ score: 40 }, { score: 41 }] },
    { userId: 'riderP', runs: [{ score: 30 }, { score: 31 }] },
    { userId: 'riderT', runs: [{ score: 20 }, { score: 21 }] },
    { userId: 'riderX', runs: [{ score: 10 }, { score: 11 }] },
  ],
};

const expectedBigCompRound1Results = {
  heats: {
    items: [
      {
        name: 'Heat 1',
        riderAllocations: {
          items: [
            { userId: 'riderA', position: 1, startSeed: 1, runs: [{ score: 60 }, { score: 61 }] },
            { userId: 'riderE', position: 2, startSeed: 5, runs: [{ score: 50 }, { score: 51 }] },
            { userId: 'riderI', position: 3, startSeed: 9, runs: [{ score: 40 }, { score: 41 }] },
            { userId: 'riderM', position: 4, startSeed: 13, runs: [{ score: 30 }, { score: 31 }] },
            { userId: 'riderQ', position: 5, startSeed: 17, runs: [{ score: 20 }, { score: 21 }] },
            { userId: 'riderU', position: 6, startSeed: 21, runs: [{ score: 10 }, { score: 11 }] },
          ],
        },
      },
      {
        name: 'Heat 2',
        riderAllocations: {
          items: [
            { userId: 'riderC', position: 1, startSeed: 3, runs: [{ score: 60 }, { score: 61 }] },
            { userId: 'riderG', position: 2, startSeed: 7, runs: [{ score: 50 }, { score: 51 }] },
            { userId: 'riderK', position: 3, startSeed: 11, runs: [{ score: 40 }, { score: 41 }] },
            { userId: 'riderO', position: 4, startSeed: 15, runs: [{ score: 30 }, { score: 31 }] },
            { userId: 'riderS', position: 5, startSeed: 19, runs: [{ score: 20 }, { score: 21 }] },
            { userId: 'riderW', position: 6, startSeed: 23, runs: [{ score: 10 }, { score: 11 }] },
          ],
        },
      },
      {
        name: 'Heat 3',
        riderAllocations: {
          items: [
            { userId: 'riderB', position: 1, startSeed: 2, runs: [{ score: 60 }, { score: 61 }] },
            { userId: 'riderF', position: 2, startSeed: 6, runs: [{ score: 50 }, { score: 51 }] },
            { userId: 'riderJ', position: 3, startSeed: 10, runs: [{ score: 40 }, { score: 41 }] },
            { userId: 'riderN', position: 4, startSeed: 14, runs: [{ score: 30 }, { score: 31 }] },
            { userId: 'riderR', position: 5, startSeed: 18, runs: [{ score: 20 }, { score: 21 }] },
            { userId: 'riderV', position: 6, startSeed: 22, runs: [{ score: 10 }, { score: 11 }] },
          ],
        },
      },
      {
        name: 'Heat 4',
        riderAllocations: {
          items: [
            { userId: 'riderD', position: 1, startSeed: 4, runs: [{ score: 60 }, { score: 61 }] },
            { userId: 'riderH', position: 2, startSeed: 8, runs: [{ score: 50 }, { score: 51 }] },
            { userId: 'riderL', position: 3, startSeed: 12, runs: [{ score: 40 }, { score: 41 }] },
            { userId: 'riderP', position: 4, startSeed: 16, runs: [{ score: 30 }, { score: 31 }] },
            { userId: 'riderT', position: 5, startSeed: 20, runs: [{ score: 20 }, { score: 21 }] },
            { userId: 'riderX', position: 6, startSeed: 24, runs: [{ score: 10 }, { score: 11 }] },
          ],
        },
      },
    ],
  },
};

const minicompScors = {
  qual: [
    { userId: 'riderA', runs: [{ score: 286 }] },
    { userId: 'riderB', runs: [{ score: 293 }] },
    { userId: 'riderC', runs: [{ score: 251 }] },
    { userId: 'riderD', runs: [{ score: 244 }] },
    { userId: 'riderE', runs: [{ score: 219 }] },
    { userId: 'riderF', runs: [{ score: 219 }] },
    { userId: 'riderG', runs: [{ score: 219 }] },
    { userId: 'riderH', runs: [{ score: 219 }] },
  ],
};

const getScoreFns = (scrs: typeof bigCompScores | typeof minicompScors) => {
  const scoreHeatFns = Object.keys(scrs).map((heatId) => {
    const heatScores = scrs[heatId];
    const scoreRunFns = heatScores.map((score) => async () =>
      await gCall({
        source: scoreRunMutation,
        variableValues: {
          input: {
            heatId,
            ...score,
          },
        },
      })
    );
    return { heatId, fns: scoreRunFns };
  });
  return scoreHeatFns;
};

describe('Score Run', () => {
  it('score big comp', async () => {
    const testContext = Container.get(TEST_CONTEXT);
    const eventService = testContext.getService(EventService);
    const heatService = testContext.getService(HeatService);

    await mockDbUtils.populateDb(mockDb.competitionPreScoreRuns);

    const scoreHeatFns = getScoreFns(bigCompScores);

    for (let i = 0; i < scoreHeatFns.length; i++) {
      const heatScores = scoreHeatFns[i];
      await eventService.updateOne({ id: 'testEvent', selectedHeatId: heatScores.heatId });
      await Promise.all(heatScores.fns.map((fn) => fn()));
    }

    const response = await gCall({
      source: getCompetitionQuery,
      variableValues: {
        id: 'testCompetition',
      },
    });

    // Close the heats
    for (let i = 0; i < scoreHeatFns.length; i++) {
      const heatScores = scoreHeatFns[i];
      // Close heat
      await heatService.updateOne({ id: heatScores.heatId, isFinished: true });
    }
    await eventService.updateOne({ id: 'testEvent', selectedHeatId: null });

    expect(response.data.getCompetition.rounds.items[0]).toMatchObject(expectedBigCompRound1Results);

    // console.log(JSON.stringify(response.data.getCompetition.rounds.items[0]));
  });

  it.skip('score mini comp', async () => {
    const testContext = Container.get(TEST_CONTEXT);
    const eventService = testContext.getService(EventService);
    await mockDbUtils.populateDb(mockDb.minComp);

    const scoreHeatFns = getScoreFns(minicompScors);

    for (let i = 0; i < scoreHeatFns.length; i++) {
      const heatScores = scoreHeatFns[i];
      await eventService.updateOne({ id: 'testEvent', selectedHeatId: heatScores.heatId });
      await Promise.all(heatScores.fns.map((fn) => fn()));
    }

    const response = await gCall({
      source: getCompetitionQuery,
      variableValues: {
        id: 'testCompetition',
      },
    });

    // ToDo : check result
  });
});
