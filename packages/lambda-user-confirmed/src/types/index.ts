/* eslint-disable camelcase */
export interface CognitoPostConfimEvent {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: CallerContext;
  triggerSource: TriggerSource;
  request: Request;
  response: any;
}

export enum TriggerSource {
  POST_AUTHENTICATION = 'PostAuthentication_Authentication',
  POST_CONFIRMATION = 'PostConfirmation_ConfirmSignUp',
}

export interface CallerContext {
  awsSdkVersion: string;
  clientId: string;
}
export interface Request {
  userAttributes: UserAttributes;
}
interface UserAttributesBase {
  given_name?: string;
  family_name?: string;
  sub: string;
  ['cognito:user_status']: string;
  email_verified: string;
  email: string;
}

export interface FederatedSignupUserAttributes extends UserAttributesBase {
  sub: string;
  identities: string;
  profile: string;
  picture?: string;
  email: string;
}

export interface EmailSignUpUserAttributes extends UserAttributesBase {
  ['custom:signUpAttributes']: string;
  ['cognito:email_alias']: string;
  ['cognito:user_status']: string;
  email_verified: string;
  email: string;
}

export type UserAttributes = FederatedSignupUserAttributes | EmailSignUpUserAttributes;
