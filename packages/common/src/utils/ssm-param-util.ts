/* eslint-disable class-methods-use-this */
/* eslint-disable camelcase */
/* eslint-disable no-useless-constructor */
/* eslint-disable max-classes-per-file */
import config from 'src/config';
import AWS from 'aws-sdk';
import jsonBeautify from 'json-beautify';

class SSMConfigUtil<T> {
  protected readonly paramPath: string;

  stage: string;

  private paramValue: T;

  constructor(stage: string) {
    this.stage = stage;
  }

  getParamPath(): string {
    const pathItems = ['', config.PROJECT_NAME, this.stage, this.paramPath].filter((v) => v != null);
    return pathItems.join('/');
  }

  paramValueToSsmString(paramValue: T): string {
    return jsonBeautify(paramValue, null, 2, 100);
  }

  async getParamValue(): Promise<T> {
    if (!this.paramValue) {
      const ssm = new AWS.SSM();
      const param = await ssm.getParameter({ Name: this.getParamPath() }).promise();
      this.paramValue = JSON.parse(param.Parameter.Value) as T;
    }
    return this.paramValue;
  }
}

// Why can't I move this to config/types
interface ILambdaConfig {
  aws_graphqlEndpoint_authRole: string;
}

export class LambdaConfig extends SSMConfigUtil<ILambdaConfig> {
  protected readonly paramPath = 'lambda-config';
}

interface IFrontendConfig {
  ENV: string;
  AWS_REGION: string;
  AWS_COGNITO_IDENDITY_POOL_ID: string;
  AWS_USER_POOLS_ID: string;
  AWS_USER_POOLS_WEB_CLIENT_ID: string;
  AWS_GRAPHQLENDPOINT_AUTHUSER: string;
  AWS_GRAPHQLENDPOINT_AUTHROLE: string;
  AWS_GRAPHQLENDPOINT_AUTHNONE: string;
  AWS_OATH_DOMAIN: string;
}

export class FrontendConfig extends SSMConfigUtil<IFrontendConfig> {
  protected readonly paramPath = 'frontend-config';
}
