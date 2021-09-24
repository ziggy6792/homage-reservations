/* eslint-disable max-len */
/* eslint-disable import/prefer-default-export */
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
import * as cognito from '@aws-cdk/aws-cognito';
import * as ssm from '@aws-cdk/aws-ssm';

import path from 'path';
import * as utils from 'src/utils';
import { MultiAuthApiGatewayLambda } from 'src/constructs/multi-auth-apigateway-lambda';
import CognitoIdentityPool from 'src/constructs/cognito-identity-pool';
import jsonBeautify from 'json-beautify';
import DbTables from 'src/constructs/db-tables';
import { StageName } from 'src/common/types';

export interface LocalTetsStackProps extends cdk.StackProps {
  readonly stageName: StageName;
}

class LocalTestStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: LocalTetsStackProps) {
    super(scope, id, props);

    console.log('environment', JSON.stringify(this.environment));

    const { stageName } = props;

    const dbTablesContruct = new DbTables(this, utils.getConstructId('db-tables', stageName), { stageName, isLocalDeployment: true });
  }
}

export default LocalTestStack;
