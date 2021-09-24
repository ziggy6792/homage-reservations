/* eslint-disable camelcase */

import Competition from 'src/domain/models/competition';
import Event from 'src/domain/models/event';
import Heat from 'src/domain/models/heat';
import RiderAllocation from 'src/domain/models/rider-allocation';
import Round from 'src/domain/models/round';
import ScheduleItem from 'src/domain/models/schedule-item';
import User from 'src/domain/models/user';
import RiderRegistration from 'src/domain/models/rider-registration';

export enum IdentityType {
  ROLE = 'role',
  USER = 'user',
  ROLE_UNAUTH = 'role_unauth',
  NONE = 'none',
}
export interface IIdentity {
  type: IdentityType;
  user?: ICognitoIdentity;
  role?: IIamIdentity;
}

export interface ICognitoIdentity {
  sub: string;
  'cognito:groups': string;
  token_use: string;
  scope: string;
  auth_time: string;
  iss: string;
  exp: string;
  iat: string;
  version: string;
  jti: string;
  client_id: string;
  username: string;
}

export interface IIamIdentity {
  cognitoIdentityPoolId: string;
  accountId: string;
  cognitoIdentityId: string;
  caller: string;
  sourceIp: string;
  principalOrgId?: null;
  accessKey: string;
  cognitoAuthenticationType: string;
  cognitoAuthenticationProvider?: null;
  userArn: string;
  userAgent: string;
  user: string;
}

export interface IDecodedJWT {
  header: IHeader;
  payload: ICognitoIdentity;
  signature: string;
}
export interface IHeader {
  kid: string;
  alg: string;
}

export interface IEvent {
  identity: ICognitoIdentity;
}

export type CreatableClassType =
  | typeof Competition
  | typeof Event
  | typeof Heat
  | typeof RiderAllocation
  | typeof Round
  | typeof User
  | typeof ScheduleItem
  | typeof RiderRegistration;
