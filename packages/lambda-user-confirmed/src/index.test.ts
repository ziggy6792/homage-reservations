/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */
import AWS from 'aws-sdk';
import AWSMock from 'aws-sdk-mock';
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { v4 as uuidv4 } from 'uuid';
import { handler } from './index';

import * as gqlApi from './services/gql-api';
import * as fbApi from './services/fb-api';
import * as s3Upload from './services/s3-upload';

import { CognitoPostConfimEvent } from './types';

AWSMock.setSDKInstance(AWS);

AWSMock.mock('CognitoIdentityServiceProvider', 'adminUpdateUserAttributes', (params, cb) => {
  console.log('adminUpdateUserAttributes called with', params);
  cb(null);
});

AWSMock.mock('CognitoIdentityServiceProvider', 'getGroup', (params, cb) => {
  console.log('getGroup called with', params);
  cb(null);
});

AWSMock.mock('CognitoIdentityServiceProvider', 'createGroup', (params, cb) => {
  console.log('createGroup called with', params);
  cb(null);
});

AWSMock.mock('CognitoIdentityServiceProvider', 'adminAddUserToGroup', (params, cb) => {
  console.log('adminAddUserToGroup called with', params);
  cb(null);
});

AWSMock.mock(
  'SSM',
  'getParameter',
  async (request) =>
    ({
      Parameter: {
        Value: JSON.stringify({ aws_graphqlEndpoint_authRole: 'http://localhost:3100/lambda-gq-resolver/auth-none/graphql' }),
      },
    } as GetParameterResult)
);

const mockUserId = uuidv4();

const emailSignupEvent = {
  version: '1',
  region: 'ap-southeast-1',
  userPoolId: 'ap-southeast-1_5zmaTsBgU',
  userName: mockUserId,
  callerContext: {
    awsSdkVersion: 'aws-sdk-unknown-unknown',
    clientId: '3cegk98tmu5kqtl2jhg1jlcl0',
  },
  triggerSource: 'PostConfirmation_ConfirmSignUp',
  request: {
    userAttributes: {
      'custom:signUpAttributes': '{"given_name":"Simon","family_name":"Verhoeven"}',
      sub: mockUserId,
      'cognito:email_alias': 'ziggy067+1@gmail.com',
      'cognito:user_status': 'CONFIRMED',
      email_verified: 'true',
      email: 'ziggy067+1@gmail.com',
    },
  },
  response: {},
} as CognitoPostConfimEvent;

const facebookSignUpEvent = {
  version: '1',
  region: 'ap-southeast-1',
  userPoolId: 'ap-southeast-1_RNMlC2yGY',
  userName: 'Facebook_100247812311264',
  callerContext: {
    awsSdkVersion: 'aws-sdk-unknown-unknown',
    clientId: '1om2i227s52mkpl4t256637ba5',
  },
  triggerSource: 'PostConfirmation_ConfirmSignUp',
  request: {
    userAttributes: {
      sub: '0144f718-6de4-413a-ba6f-232881aa4f08',
      email_verified: 'false',
      'cognito:user_status': 'EXTERNAL_PROVIDER',
      identities: '[{"userId":"100247812311264","providerName":"Facebook","providerType":"Facebook","issuer":null,"primary":true,"dateCreated":1623867891838}]',
      profile:
        'EAAFtm1XZAb1IBAGbNSvdUVMLWwTyImKcuJp6gM4qinkkS4riQ07ZAZCo2MZAl1l68qk7ghD7h5qChZCMHAUUU8t1BUMyuwzD4ZAZC35oB8ZCsMblpjJSGBEIUS2x9xu93ZBv490rwoa0stCDnv2GQoYGtrGOQfiXxaKyErPXZBW5ZBhvUn5aHVXuVbGU00QAyzPw8YZD',
      given_name: 'Simon',
      family_name: 'Verhoeven-Test',
      email: 'ziggy067s1@gmail.com',
    },
  },
  response: {},
} as CognitoPostConfimEvent;

const facebookPostAuthEvent = {
  version: '1',
  region: 'ap-southeast-1',
  userPoolId: 'ap-southeast-1_RNMlC2yGY',
  userName: 'Facebook_100247812311264',
  callerContext: {
    awsSdkVersion: 'aws-sdk-unknown-unknown',
    clientId: '1om2i227s52mkpl4t256637ba5',
  },
  triggerSource: 'PostAuthentication_Authentication',
  request: {
    userAttributes: {
      sub: '0144f718-6de4-413a-ba6f-232881aa4f08',
      email_verified: 'false',
      'cognito:user_status': 'EXTERNAL_PROVIDER',
      identities: '[{"userId":"100247812311264","providerName":"Facebook","providerType":"Facebook","issuer":null,"primary":true,"dateCreated":1623867891838}]',
      profile:
        'EAAFtm1XZAb1IBAGbNSvdUVMLWwTyImKcuJp6gM4qinkkS4riQ07ZAZCo2MZAl1l68qk7ghD7h5qChZCMHAUUU8t1BUMyuwzD4ZAZC35oB8ZCsMblpjJSGBEIUS2x9xu93ZBv490rwoa0stCDnv2GQoYGtrGOQfiXxaKyErPXZBW5ZBhvUn5aHVXuVbGU00QAyzPw8YZD',
      given_name: 'Simon',
      family_name: 'Verhoeven-Test',
      email: 'ziggy067s1@gmail.com',
    },
  },
  response: {},
} as CognitoPostConfimEvent;

const expectedModelUser = {
  id: 'Facebook_100247812311264',
  firstName: 'Simon',
  lastName: 'Verhoeven-Test',
  email: 'ziggy067s1@gmail.com',
  profilePicture: {
    width: 159,
    height: 159,
    s3Object: { key: 'profile-pictures/Facebook_100247812311264.jpeg' },
  },
};

const savedUser = {
  id: 'Facebook_100247812311264',
  profilePicture: {
    putUrl:
      'https://alpaca-backend-staging-file-uploads.s3.amazonaws.com/picture.jpeg?AWSAccessKeyId=AKIA5SDQV44NT4OFJFMH&Content-Type=application%2Foctet-stream&Expires=1629660941&Signature=rGveGlb8ImLTyx3MaiAnzaLk1rs%3D&x-amz-acl=public-read',
  },
  __typename: 'User',
};

describe('test lambda-user-confirmed', () => {
  const spyOnRegisterUser = jest.spyOn(gqlApi, 'registerUser').mockResolvedValue(savedUser);
  const spyOnUpdateUser = jest.spyOn(gqlApi, 'updateUser').mockResolvedValue(savedUser);

  jest.spyOn(fbApi, 'getFacebookProfilePicture').mockResolvedValue({
    height: 159,
    is_silhouette: false,
    url: 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=10224795420532374&height=800&width=800&ext=1630910565&hash=AeRm-7f-5jr2DWN-He8',
    width: 159,
  });

  const spyOnSaveImage = jest.spyOn(s3Upload, 'uploadSignedRequest').mockResolvedValue(true);

  test('email signup', async () => {
    const mockCallback = jest.fn();

    process.env.AWS_REGION = 'ap-southeast-1';

    const actualResult = await handler(emailSignupEvent, {} as undefined, mockCallback);

    const expectedResult = {
      version: '1',
      region: 'ap-southeast-1',
      userPoolId: 'ap-southeast-1_5zmaTsBgU',
      userName: mockUserId,
      callerContext: {
        awsSdkVersion: 'aws-sdk-unknown-unknown',
        clientId: '3cegk98tmu5kqtl2jhg1jlcl0',
      },
      triggerSource: 'PostConfirmation_ConfirmSignUp',
      request: {
        userAttributes: {
          sub: mockUserId,
          'cognito:email_alias': 'ziggy067+1@gmail.com',
          'cognito:user_status': 'CONFIRMED',
          email_verified: 'true',
          email: 'ziggy067+1@gmail.com',
          given_name: 'Simon',
          family_name: 'Verhoeven',
        },
      },
      response: {},
    };

    expect(actualResult).toEqual(expectedResult);
  });

  test('facebook signup', async () => {
    const mockCallback = jest.fn();

    process.env.AWS_REGION = 'ap-southeast-1';

    const actualResult = await handler(facebookSignUpEvent, {} as undefined, mockCallback);

    const expectedResult = {
      version: '1',
      region: 'ap-southeast-1',
      userPoolId: 'ap-southeast-1_RNMlC2yGY',
      userName: 'Facebook_100247812311264',
      callerContext: { awsSdkVersion: 'aws-sdk-unknown-unknown', clientId: '1om2i227s52mkpl4t256637ba5' },
      triggerSource: 'PostConfirmation_ConfirmSignUp',
      request: {
        userAttributes: {
          sub: '0144f718-6de4-413a-ba6f-232881aa4f08',
          email_verified: 'false',
          'cognito:user_status': 'EXTERNAL_PROVIDER',
          identities:
            '[{"userId":"100247812311264","providerName":"Facebook","providerType":"Facebook","issuer":null,"primary":true,"dateCreated":1623867891838}]',
          given_name: 'Simon',
          family_name: 'Verhoeven-Test',
          email: 'ziggy067s1@gmail.com',
        },
      },
      response: {},
    };

    expect(actualResult).toEqual(expectedResult);
    expect(spyOnRegisterUser).toHaveBeenCalledWith(expectedModelUser);
    expect(spyOnSaveImage).toHaveBeenCalled();
  });

  test.only('facebook post auth', async () => {
    const mockCallback = jest.fn();

    process.env.AWS_REGION = 'ap-southeast-1';

    const actualResult = await handler(facebookPostAuthEvent, {} as undefined, mockCallback);

    const expectedResult = {
      version: '1',
      region: 'ap-southeast-1',
      userPoolId: 'ap-southeast-1_RNMlC2yGY',
      userName: 'Facebook_100247812311264',
      callerContext: { awsSdkVersion: 'aws-sdk-unknown-unknown', clientId: '1om2i227s52mkpl4t256637ba5' },
      triggerSource: 'PostAuthentication_Authentication',
      request: {
        userAttributes: {
          sub: '0144f718-6de4-413a-ba6f-232881aa4f08',
          email_verified: 'false',
          'cognito:user_status': 'EXTERNAL_PROVIDER',
          identities:
            '[{"userId":"100247812311264","providerName":"Facebook","providerType":"Facebook","issuer":null,"primary":true,"dateCreated":1623867891838}]',
          given_name: 'Simon',
          family_name: 'Verhoeven-Test',
          email: 'ziggy067s1@gmail.com',
        },
      },
      response: {},
    };

    expect(actualResult).toEqual(expectedResult);

    expect(spyOnUpdateUser).toHaveBeenCalledWith(expectedModelUser);
    expect(spyOnSaveImage).toHaveBeenCalled();
  });
});
