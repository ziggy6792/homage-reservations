// eslint-disable-next-line import/no-extraneous-dependencies
import aws from 'aws-sdk';
import { CognitoPostConfimEvent } from 'src/types';

const addToGroup = async (event: CognitoPostConfimEvent): Promise<CognitoPostConfimEvent> => {
  console.log('add-to-group');

  await addUserToGroup(event, 'user');
  return event;
};

const addUserToGroup = async (event: CognitoPostConfimEvent, groupName: string) => {
  const cognitoidentityserviceprovider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });
  const groupParams = {
    GroupName: groupName,
    UserPoolId: event.userPoolId,
  };

  const addUserParams = {
    GroupName: groupName,
    UserPoolId: event.userPoolId,
    Username: event.userName,
  };

  try {
    await cognitoidentityserviceprovider.getGroup(groupParams).promise();
  } catch (e) {
    await cognitoidentityserviceprovider.createGroup(groupParams).promise();
  }

  await cognitoidentityserviceprovider.adminAddUserToGroup(addUserParams).promise();
};

export default addToGroup;
