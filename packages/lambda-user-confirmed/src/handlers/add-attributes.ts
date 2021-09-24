/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable-line */
import aws from 'aws-sdk';
import _ from 'lodash';
import * as lambda from 'aws-lambda';
import { CognitoPostConfimEvent, TriggerSource } from 'src/types';
import { Picture } from 'src/services/fb-api';

const addAttributes = async (event: CognitoPostConfimEvent): Promise<CognitoPostConfimEvent> => {
  const { userAttributes } = event.request;

  const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

  let attributesToUpdate: {
    Name: string;
    Value: unknown;
  }[] = [];

  // if (profilePicture) {
  //   const userProfilePic =

  //   attributesToUpdate.push();
  // }

  if ('profile' in userAttributes) {
    delete userAttributes.profile;
  }
  if (event.triggerSource === TriggerSource.POST_CONFIRMATION) {
    // Is email signup

    const customSignUpAttributesString = userAttributes['custom:signUpAttributes'];
    const customSignUpAttributes = customSignUpAttributesString ? JSON.parse(customSignUpAttributesString) : undefined;

    if (customSignUpAttributes) {
      const updateUserAttributes = { ...userAttributes, ...customSignUpAttributes };
      delete updateUserAttributes['custom:signUpAttributes'];
      event.request.userAttributes = updateUserAttributes;

      attributesToUpdate = Object.entries(customSignUpAttributes).map(([key, value]) => ({ Name: key, Value: value }));
    } else {
      console.log('no sign up attributes');
    }
  }

  console.log('attributesToUpdate');
  console.log(attributesToUpdate);

  if (attributesToUpdate.length > 0) {
    const updateAttributesParams = {
      UserAttributes: attributesToUpdate,
      UserPoolId: event.userPoolId,
      Username: event.userName,
    };
    await cognitoidentityserviceprovider.adminUpdateUserAttributes(updateAttributesParams as any).promise();
  }

  // ToDo
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminDeleteUserAttributes-property

  return event;
};

export default addAttributes;
