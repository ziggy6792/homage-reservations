/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export */
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito';
import * as ssm from '@aws-cdk/aws-ssm';
import * as s3 from '@aws-cdk/aws-s3';

import path from 'path';
import * as utils from 'src/utils';
import { MultiAuthApiGatewayLambda, RESOURCE_TYPE } from 'src/constructs/multi-auth-apigateway-lambda';
import CognitoIdentityPool from 'src/constructs/cognito-identity-pool';
import jsonBeautify from 'json-beautify';
import DbTables from 'src/constructs/db-tables';
import { StageName } from 'src/common/types';
import { commonUtils } from '@alpaca-backend/common';

export interface DeploymentStackProps extends cdk.StackProps {
  readonly stageName: StageName;
  readonly facebookClientId: string;
  readonly facebookClientSecret: string;
  readonly domainPrefix: string;
}

class DeploymentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: DeploymentStackProps) {
    super(scope, id, props);

    // this.node.setContext('@aws-cdk/core:newStyleStackSynthesis', 'true');

    const { stageName, facebookClientId, facebookClientSecret, domainPrefix } = props;

    const REGION = 'ap-southeast-1';

    const callbackUrls = ['http://localhost:3000/profile/'];
    const logoutUrls = ['http://localhost:3000/profile/'];

    const scopes = [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PHONE, cognito.OAuthScope.COGNITO_ADMIN];

    const lambdaGqResolverEnv = {
      REGION,
      ENV: stageName,
    };

    const apiConstruct = new MultiAuthApiGatewayLambda(this, utils.getConstructId('api', stageName), {
      enableAuthNone: stageName !== StageName.PROD && stageName !== StageName.DUMMY,
      lambdaFunctionProps: {
        functionName: utils.getConstructName('gq-resolver', stageName),
        description: utils.getConstructDescription('gq-resolver', stageName),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(require.resolve('@alpaca-backend/lambda-gq-resolver'), '..')),
        environment: lambdaGqResolverEnv,
      },
      apiGatewayProps: {
        restApiName: utils.getConstructName('api', stageName),
        description: utils.getConstructDescription('api', stageName),
        proxy: false,
        deployOptions: { stageName },
        defaultCorsPreflightOptions: {
          allowOrigins: ['*'],
          allowHeaders: ['*'],
          allowMethods: ['*'],
        },
      },
      cognitoUserPoolProps: {
        userPoolName: utils.getConstructName('userpool', stageName),
        selfSignUpEnabled: true,
        signInAliases: {
          email: true,
        },
        autoVerify: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
        },
        customAttributes: {
          signUpAttributes: new cognito.StringAttribute({ minLen: 1, maxLen: 2048, mutable: true }),
        },
        passwordPolicy: {
          tempPasswordValidity: cdk.Duration.days(2),
          minLength: 6,
          requireDigits: false,
          requireLowercase: false,
          requireUppercase: false,
          requireSymbols: false,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      },
      scopes,
    });

    // Add facebook integration
    const identityProviderFacebook = new cognito.UserPoolIdentityProviderFacebook(this, utils.getConstructId('facebook', stageName), {
      userPool: apiConstruct.userPool,
      clientId: facebookClientId,
      clientSecret: facebookClientSecret,
      scopes: ['email', 'public_profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.FACEBOOK_EMAIL,
        givenName: cognito.ProviderAttribute.FACEBOOK_FIRST_NAME,
        familyName: cognito.ProviderAttribute.FACEBOOK_LAST_NAME,
      },
    });

    // Add App client
    const client = apiConstruct.userPool.addClient(utils.getConstructId('client', stageName), {
      userPoolClientName: utils.getConstructName('client', stageName),
      oAuth: {
        flows: { authorizationCodeGrant: true, implicitCodeGrant: true },
        scopes,
        callbackUrls,
        logoutUrls,
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO, cognito.UserPoolClientIdentityProvider.FACEBOOK],

      // supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
    });

    client.node.addDependency(identityProviderFacebook);

    apiConstruct.userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix,
      },
    });
    // Add identiy pool

    const identityPoolConstruct = new CognitoIdentityPool(this, utils.getConstructId('identitypool', stageName), {
      identityPoolProps: {
        allowUnauthenticatedIdentities: true, // Allow unathenticated users
        cognitoIdentityProviders: [
          {
            clientId: client.userPoolClientId,
            providerName: apiConstruct.userPool.userPoolProviderName,
          },
        ],
      },
    });

    const { authdResources } = apiConstruct;

    const authUserResource = authdResources.find(({ type }) => type === RESOURCE_TYPE.AUTH_USER);
    const authRoleResource = authdResources.find(({ type }) => type === RESOURCE_TYPE.AUTH_ROLE);
    const authNoneResource = authdResources.find(({ type }) => type === RESOURCE_TYPE.AUTH_NONE);

    const gqUrls: { [key: string]: string } = {};

    authdResources.forEach((authdResource) => {
      const graphqlResource = authdResource.resource.addResource('graphql');
      gqUrls[authdResource.resource.path] = apiConstruct.apiGateway.urlForPath(graphqlResource.path);
      graphqlResource.addMethod('GET');
      graphqlResource.addMethod('POST');
    });

    const fileuUploadsBucket = new s3.Bucket(this, utils.getConstructId(commonUtils.BucketName.FILE_UPLOADS, stageName), {
      blockPublicAccess: new s3.BlockPublicAccess({ blockPublicPolicy: false }),
      publicReadAccess: false,
      bucketName: commonUtils.getS3BucketName(commonUtils.BucketName.FILE_UPLOADS, stageName),
    });

    const lambdaUserConfirmed = new lambda.Function(this, utils.getConstructId('userconfirmed', stageName), {
      functionName: utils.getConstructName('user-confirmed', stageName),
      description: utils.getConstructDescription('user-confirmed', stageName),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(require.resolve('@alpaca-backend/lambda-user-confirmed'), '..')),
      environment: {
        ENV: stageName,
      },
    });

    fileuUploadsBucket.grantReadWrite(apiConstruct.lambdaFunction);

    // lambdaUserConfirmed.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'));
    lambdaUserConfirmed.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));
    lambdaUserConfirmed.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonCognitoPowerUser'));

    const rolesWithApiAccesss = {
      UserConfirmed: lambdaUserConfirmed.role,
      IdentityPoolAuthenticated: identityPoolConstruct.authentictedRole,
      IdentityPoolUnauthenticated: identityPoolConstruct.unauthenticatedRole,
    };

    apiConstruct.addAuthorizers(rolesWithApiAccesss);

    apiConstruct.userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, lambdaUserConfirmed);
    apiConstruct.userPool.addTrigger(cognito.UserPoolOperation.POST_AUTHENTICATION, lambdaUserConfirmed);

    apiConstruct.lambdaFunction.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const dbTablesContruct = new DbTables(this, utils.getConstructId('db-tables', stageName), { stageName, isLocalDeployment: false });

    // Need to put gql endpoint in param store to avoid circular stack dependency
    const lambdaConfig = new commonUtils.LambdaConfig(stageName);

    const lambdaConfigSSM = new ssm.StringParameter(this, utils.getConstructId('lambda-config', stageName), {
      parameterName: lambdaConfig.getParamPath(),
      stringValue: lambdaConfig.paramValueToSsmString({ aws_graphqlEndpoint_authRole: gqUrls[authRoleResource?.resource.path] }),
    });

    const frontendConfig = {
      ENV: stageName,
      AWS_REGION: 'ap-southeast-1',
      AWS_COGNITO_IDENDITY_POOL_ID: identityPoolConstruct.identityPool.ref,
      AWS_USER_POOLS_ID: apiConstruct.userPool.userPoolId,
      AWS_USER_POOLS_WEB_CLIENT_ID: client.userPoolClientId,
      AWS_GRAPHQLENDPOINT_AUTHUSER: authUserResource && gqUrls[authUserResource.resource.path],
      AWS_GRAPHQLENDPOINT_AUTHROLE: authRoleResource && gqUrls[authRoleResource.resource.path],
      AWS_GRAPHQLENDPOINT_AUTHNONE: authNoneResource && gqUrls[authNoneResource.resource.path],
      AWS_OATH_DOMAIN: `${domainPrefix}.auth.ap-southeast-1.amazoncognito.com`,
    };

    const ssmFrontendConfig = new commonUtils.FrontendConfig(stageName);

    const localLambdaServerConfig = {
      REGION,
      ENV: 'dev',
      COGNITO_USER_POOL_ID: apiConstruct.userPool.userPoolId,
    };

    const localLambdaServerConfigOutput = new cdk.CfnOutput(this, 'locallambda-config', {
      description: 'local-lambda-config',
      value: jsonBeautify(localLambdaServerConfig, null, 2, 100),
    });

    const clientConfigOutput = new cdk.CfnOutput(this, 'frontend-config', {
      description: 'frontend-config',
      value: ssmFrontendConfig.paramValueToSsmString(frontendConfig),
    });

    const clientConfSSM = new ssm.StringParameter(this, utils.getConstructId('frontend-config', stageName), {
      parameterName: ssmFrontendConfig.getParamPath(),
      stringValue: ssmFrontendConfig.paramValueToSsmString(frontendConfig),
    });
  }
}

export default DeploymentStack;
