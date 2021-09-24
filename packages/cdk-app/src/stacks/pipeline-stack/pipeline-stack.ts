import { commonConfig } from '@alpaca-backend/common';
/* eslint-disable import/prefer-default-export */
import * as cdk from '@aws-cdk/core';

import * as cdkPipeline from '@aws-cdk/pipelines';
import * as iam from '@aws-cdk/aws-iam';

import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineActions from '@aws-cdk/aws-codepipeline-actions';
import * as utils from 'src/utils';
import * as config from 'src/config';
import { StageName } from 'src/common/types';
import { DeploymentStage } from './deployment-stage';

class PipelineStack extends cdk.Stack {
  public readonly stagingUrlOutput: cdk.CfnOutput;

  public readonly prodUrlOutput: cdk.CfnOutput;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // this.node.setContext('@aws-cdk/core:newStyleStackSynthesis', 'true');

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();

    const synthAction = cdkPipeline.SimpleSynthAction.standardYarnSynth({
      actionName: 'BuildTestSynth',
      environment: { privileged: true },
      sourceArtifact,
      cloudAssemblyArtifact,
      // installCommand: 'yarn install',
      buildCommand: 'yarn lint && yarn build && yarn test:with:env',
      synthCommand: 'yarn cdk:synth',
    });

    const pipeline = new cdkPipeline.CdkPipeline(this, utils.getConstructId('pipeline'), {
      pipelineName: utils.getConstructId('pipeline'),
      cloudAssemblyArtifact,

      sourceAction: new codepipelineActions.GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: cdk.SecretValue.secretsManager('GITHUB_OATH_TOKEN', { jsonField: 'GITHUB_OATH_TOKEN' }),
        trigger: codepipelineActions.GitHubTrigger.POLL,
        // Replace these with your actual GitHub project info
        owner: 'waketools',
        repo: commonConfig.PROJECT_NAME,
        branch: 'master',
      }),
      synthAction,
    });

    synthAction.project.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));

    // ****** START SEPETATE TEST ACTION (Removed seperate action for test to save money)
    // const testAction = new cdkPipeline.ShellScriptAction({
    //   environment: { privileged: true },
    //   actionName: 'Test',
    //   additionalArtifacts: [sourceArtifact],
    //   runOrder: 1,
    //   commands: ['yarn install', 'yarn build', 'yarn test:with:env'],
    // });

    // pipeline.codePipeline.stages[1].addAction(testAction);

    // testAction.project.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess'));
    // ****** END SEPETATE TEST ACTION

    // Account and region may be different from the pipeline's.
    // Do this as many times as necessary with any account and region

    const deployedStagingStage = new DeploymentStage(this, utils.getConstructId('staging'), {
      stageName: StageName.STAGING,
      env: {
        account: config.AWS_ACCOUNT_ID,
        region: config.AWS_REGION,
      },
    });

    const stagingStage = pipeline.addApplicationStage(deployedStagingStage);

    // Manual Approval
    // stagingStage.addManualApprovalAction({
    //   actionName: 'ManualApproval',
    //   runOrder: stagingStage.nextSequentialRunOrder(),
    // });

    // Do this as many times as necessary with any account and region
    // Account and region may be different from the pipeline's.

    const deployedProdStage = new DeploymentStage(this, utils.getConstructId('prod'), {
      stageName: StageName.PROD,
      env: {
        account: config.AWS_ACCOUNT_ID,
        region: config.AWS_REGION,
      },
    });

    const prodStage = pipeline.addApplicationStage(deployedProdStage);

    // Manual Approval
    prodStage.addManualApprovalAction({
      actionName: 'ManualApproval',
      runOrder: 1,
    });
  }
}

export default PipelineStack;
