/* eslint-disable camelcase */
import * as lambda from 'aws-lambda';
import { CognitoPostConfimEvent, TriggerSource } from 'src/types';
import * as api from 'src/services/gql-api';
import { initApolloClient } from 'src/utils/apollo-client';
import { Picture } from 'src/services/fb-api';
import { commonUtils } from '@alpaca-backend/common';
import { ENV } from 'src/config';
import { uploadSignedRequest } from 'src/services/s3-upload';

const addUserToModel = async (event: CognitoPostConfimEvent, profilePicture: Picture): Promise<CognitoPostConfimEvent> => {
  const lambdaConfig = await new commonUtils.LambdaConfig(ENV).getParamValue();

  initApolloClient({
    region: process.env.AWS_REGION,
    uri: lambdaConfig.aws_graphqlEndpoint_authRole,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  });

  const { userName } = event;

  const { userAttributes } = event.request;
  // eslint-disable-next-line camelcase
  const { email, given_name, family_name } = userAttributes;

  const user = {
    id: userName,
    firstName: given_name,
    lastName: family_name,
    email,
    profilePicture: profilePicture
      ? {
          width: profilePicture.width,
          height: profilePicture.height,
          s3Object: {
            key: `profile-pictures/${userName}.jpeg`,
          },
        }
      : null,
  };

  console.log('User Object', JSON.stringify(user));

  let savedUser: any;
  if (event.triggerSource === TriggerSource.POST_CONFIRMATION) {
    savedUser = await api.registerUser(user);
  } else if (event.triggerSource === TriggerSource.POST_AUTHENTICATION) {
    savedUser = await api.updateUser(user);
  }

  console.log('savedUser', JSON.stringify(savedUser));

  if (!savedUser) {
    throw new Error('Error calling api');
  }

  if (profilePicture) {
    await uploadSignedRequest(profilePicture.url, savedUser.profilePicture.putUrl);
  }

  return event;
};

export default addUserToModel;
