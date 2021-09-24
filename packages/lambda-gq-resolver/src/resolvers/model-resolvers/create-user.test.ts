/* eslint-disable no-return-await */
import { TEST_CONTEXT } from '@test-utils/tokens';
import { UserService } from 'src/services';
import { gCall } from 'src/test-utils/g-call';
import testConn from 'src/test-utils/test-conn';
import Container from 'typedi';

beforeAll(async () => {
  await testConn();
});

afterAll(async () => {
  // AWS.DynamoDB
});

const createUserMutation = `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    firstName
    lastName
    fullName
  }
}`;

describe('User', () => {
  it('create user', async () => {
    const testContext = Container.get(TEST_CONTEXT);
    const userService = testContext.getService(UserService);

    const user = { firstName: 'Test Firstname', lastName: 'Test Lastname', email: 'testy@test.com' };

    const response = await gCall({
      source: createUserMutation,
      variableValues: { input: user },
    });

    expect(response).toMatchObject({
      data: {
        createUser: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      },
    });

    await expect(userService.getOne(response.data.createUser.id)).resolves.toBeTruthy();
  });
});
