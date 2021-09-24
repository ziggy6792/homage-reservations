/* eslint-disable no-await-in-loop */
/* eslint-disable no-return-await */
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import * as mockDb from '@test-utils/mock-db';
import mockDbUtils from '@test-utils/mock-db/mock-db-utils';
import _ from 'lodash';

beforeAll(async () => {
  await testConn();
});

// const heavyQuery = `query getEvent($id: ID!) {
//   getEvent(id: $id) {
//     isAdmin
//     id
//     name
//     startTime
//     description
//     competitions {
//       items {
//         id
//         riderRegistrations {
//           items {
//             user {
//               id
//             }
//           }
//         }
//         rounds {
//           items {
//             id
//             competition{
//               rounds{
//                 items{
//                   heats{
//                     items{
//                       riderAllocations{
//                         items{
//                           user{
//                             id
//                           }
//                         }
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//             heats {
//               items {
//                 seedSlots {
//                   isProgressing
//                   previousHeat {
//                     riderAllocations {
//                       items {
//                         user {
//                           id
//                         }
//                       }
//                     }
//                   }
//                 }
//                 riderAllocations {
//                   items {
//                     user {
//                       id
//                     }
//                   }
//                 }
// incomingHeats {
//                   riderAllocations {
//                     items {
//                       user {
//                         id
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }
// `;

const heavyQuery = `query getEvent($id: ID!) {
  getEvent(id: $id) {
    isAdmin
    id
    name
    startTime
    description
    competitions {
      items {
        id
        rounds {
          items {
            competition {              
              rounds {
                items {
                  heats {
                    items {
                      id
                      seedSlots {
                        previousHeat {
                          id
                        }
                        nextHeat {
                          id
                        }
                        isProgressing
                      }
                      round {
                        id
                      }
                      incomingHeats {
                        id
                      }
                    }
                  }
                }
              }
            }
            id

          }
        }
      }
    }
  }
}`;

const expectedResponse = {
  data: {
    getEvent: {
      isAdmin: false,
      id: 'testEvent',
      name: 'Test Event',
      startTime: '2021-03-13T08:00:00.000Z',
      description: 'Test Event Description',
      competitions: {
        items: [
          {
            id: 'testCompetition',
            rounds: {
              items: [
                {
                  competition: {
                    rounds: {
                      items: [
                        {
                          heats: {
                            items: [
                              {
                                id: 'heat1',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat2',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat3',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat4',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'lcq1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }],
                              },
                              {
                                id: 'lcq2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'sf1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq1' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }, { id: 'lcq1' }],
                              },
                              {
                                id: 'sf2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }, { id: 'lcq2' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'final',
                                seedSlots: [
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round3Upper' },
                                // incomingHeats: [{ id: 'sf1' }, { id: 'sf2' }],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  id: 'round1Upper',
                },
                {
                  competition: {
                    rounds: {
                      items: [
                        {
                          heats: {
                            items: [
                              {
                                id: 'heat1',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat2',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat3',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat4',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'lcq1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }],
                              },
                              {
                                id: 'lcq2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'sf1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq1' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }, { id: 'lcq1' }],
                              },
                              {
                                id: 'sf2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }, { id: 'lcq2' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'final',
                                seedSlots: [
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round3Upper' },
                                // incomingHeats: [{ id: 'sf1' }, { id: 'sf2' }],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  id: 'round2Lower',
                },
                {
                  competition: {
                    rounds: {
                      items: [
                        {
                          heats: {
                            items: [
                              {
                                id: 'heat1',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat2',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat3',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat4',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'lcq1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }],
                              },
                              {
                                id: 'lcq2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'sf1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq1' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }, { id: 'lcq1' }],
                              },
                              {
                                id: 'sf2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }, { id: 'lcq2' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'final',
                                seedSlots: [
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round3Upper' },
                                // incomingHeats: [{ id: 'sf1' }, { id: 'sf2' }],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  id: 'round2Upper',
                },
                {
                  competition: {
                    rounds: {
                      items: [
                        {
                          heats: {
                            items: [
                              {
                                id: 'heat1',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat2',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq1' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat3',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                              {
                                id: 'heat4',
                                seedSlots: [
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                  { previousHeat: null, nextHeat: { id: 'lcq2' }, isProgressing: false },
                                ],
                                round: { id: 'round1Upper' },
                                // incomingHeats: [],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'lcq1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'sf1' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }],
                              },
                              {
                                id: 'lcq2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'sf2' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat3' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Lower' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'sf1',
                                seedSlots: [
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat1' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq1' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat1' }, { id: 'heat2' }, { id: 'lcq1' }],
                              },
                              {
                                id: 'sf2',
                                seedSlots: [
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat3' }, nextHeat: { id: 'final' }, isProgressing: true },
                                  { previousHeat: { id: 'heat4' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'lcq2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round2Upper' },
                                // incomingHeats: [{ id: 'heat3' }, { id: 'heat4' }, { id: 'lcq2' }],
                              },
                            ],
                          },
                        },
                        {
                          heats: {
                            items: [
                              {
                                id: 'final',
                                seedSlots: [
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: true },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf1' }, nextHeat: null, isProgressing: false },
                                  { previousHeat: { id: 'sf2' }, nextHeat: null, isProgressing: false },
                                ],
                                round: { id: 'round3Upper' },
                                // incomingHeats: [{ id: 'sf1' }, { id: 'sf2' }],
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  id: 'round3Upper',
                },
              ],
            },
          },
        ],
      },
    },
  },
};

const executeQuery = async (): Promise<number> => {
  const timeA = new Date().getTime();
  const response = await gCall({
    source: heavyQuery,
    variableValues: {
      id: 'testEvent',
    },
  });
  console.log(response);
  // expect(response).toMatchObject(expectedResponse);
  const timeB = new Date().getTime();
  const time = timeB - timeA;
  console.log(`TIME: ${time}`);
  return time;
};

const average = (array: number[]) => (array?.length > 0 ? array.reduce((a, b) => a + b) / array.length : null);

describe('Performance', () => {
  it.skip('Performance', async () => {
    await mockDbUtils.populateDb(mockDb.competitionPreEndHeat);

    // const times = await Promise.all(_.range(0, 3).map(() => executeQuery()));
    const times = [];

    for (let i = 0; i < 3; i++) {
      const time = await executeQuery();
      times.push(time);
    }

    console.log('times', times);
    console.log('average', average(times));
  });
});
