/* eslint-disable no-return-await */
import { cognitoUsers } from '@test-utils/mock-db/test-users';
import { TEST_CONTEXT } from '@test-utils/tokens';
import _ from 'lodash';
import Event from 'src/domain/models/event';
import { EventService } from 'src/services';
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import Container from 'typedi';

beforeAll(async () => {
  await testConn();
});

const createEventMutation = `mutation createEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      adminUserId
      startTime
      name
    }
  }`;

const pad = (number: number, digits: number): string => Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;

describe('Create Event', () => {
  it('create event', async () => {
    const testContext = Container.get(TEST_CONTEXT);
    const eventService = testContext.getService(EventService);
    const event = {
      id: 'testEvent',
      name: 'Test Evemt',
      startTime: '2021-03-01T05:00:00.000Z',
      adminUserId: cognitoUsers.adminUser.id,
    };

    const response = await gCall({
      source: createEventMutation,
      variableValues: { input: event },
    });

    expect(response).toMatchObject({
      data: {
        createEvent: event,
      },
    });

    await expect(eventService.getOne(response.data.createEvent.id)).resolves.toBeTruthy();
  });

  it.skip('create events', async () => {
    const testContext = Container.get(TEST_CONTEXT);
    const eventService = testContext.getService(EventService);
    const testEvents = _.range(1, 4).map((index) => ({
      id: `testEvent${index}`,
      name: `Test Event ${index}`,
      startTime: `2021-03-${pad(index, 2)}T05:00:00.000Z`,
      adminUserId: cognitoUsers.adminUser.id,
    }));

    const response = await Promise.all(
      testEvents.map((event) =>
        gCall({
          source: createEventMutation,
          variableValues: { input: event },
        })
      )
    );

    await expect(eventService.getOne(response[0].data.createEvent.id)).resolves.toBeTruthy();
  });
});
