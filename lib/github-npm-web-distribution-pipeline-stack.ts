import { Construct, Stack, StackProps, SecretValue, Arn, Duration } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction, S3DeployAction, LambdaInvokeAction } from '@aws-cdk/aws-codepipeline-actions';

export interface GithubNpmWebDistributionPipelineProps {
  githubTokenName: string,
  githubOwner: string,
  githubRepo: string,
  npmArtifactDir: string,
  npmArtifactFiles: string,
  s3Bucket: Bucket,
  distributionId: string,
}

export class GithubNpmWebDistributionPipelineStack extends Stack {

  constructor(scope: Construct, id: string,
      githubNpmWebDistributionPipelineProps: GithubNpmWebDistributionPipelineProps, props?: StackProps) {
    super(scope, id, props);
    const githubOutput = new Artifact('GithubOutput');
    const githubToken = SecretValue.secretsManager(githubNpmWebDistributionPipelineProps.githubTokenName);
    const githubSource = new GitHubSourceAction({
      actionName: 'GithubSource',
      output: githubOutput,
      oauthToken: githubToken,
      owner: githubNpmWebDistributionPipelineProps.githubOwner,
      repo: githubNpmWebDistributionPipelineProps.githubRepo,
    });
    const sourceStage = {
      stageName: 'Source',
      actions: [
        githubSource,
      ],
    };
    const npmSpec = BuildSpec.fromObject({
      version: '0.2',
      phases: {
        install: {
          commands: 'npm ci',
        },
        build: {
          commands: 'npm run build',
        },
      },
      artifacts: {
        'base-directory': githubNpmWebDistributionPipelineProps.npmArtifactDir,
        files: githubNpmWebDistributionPipelineProps.npmArtifactFiles,
      },
    });
    const linuxEnvironment = {
      buildImage: LinuxBuildImage.STANDARD_5_0,
    };
    const npmProject = new PipelineProject(this, 'NpmProject', {
      buildSpec: npmSpec,
      environment: linuxEnvironment,
    });
    const npmOutput = new Artifact('NpmOutput');
    const npmBuild = new CodeBuildAction({
      actionName: 'NpmBuild',
      project: npmProject,
      input: githubOutput,
      outputs: [
        npmOutput,
      ],
    });
    const buildStage = {
      stageName: 'Build',
      actions: [
        npmBuild,
      ],
    };
    const s3Deploy = new S3DeployAction({
      actionName: 'S3Deploy',
      input: npmOutput,
      bucket: githubNpmWebDistributionPipelineProps.s3Bucket,
    });
    const deployStage = {
      stageName: 'Deploy',
      actions: [
        s3Deploy,
      ],
    };
    const distributionArn = Arn.format({
      service: 'cloudfront',
      resource: 'distribution',
      region: '',
      resourceName: githubNpmWebDistributionPipelineProps.distributionId,
    }, this);
    const updatePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cloudfront:GetDistributionConfig',
        'cloudfront:UpdateDistribution',
      ],
      resources: [
        distributionArn,
      ]
    });
    const updateHandler = new Function(this, 'UpdateHandler', {
      runtime: Runtime.PYTHON_3_8,
      handler: 'update_cdn.update_handler',
      code: Code.fromAsset(`${__dirname}/handler`),
      timeout: Duration.minutes(1),
      initialPolicy: [
        updatePolicy,
      ]
    });
    const invokeParams = {
      distributionId: githubNpmWebDistributionPipelineProps.distributionId,
    }
    const cdnUpdate = new LambdaInvokeAction({
      actionName: 'CdnUpdate',
      lambda: updateHandler,
      userParameters: invokeParams,
    });
    const updateStage = {
      stageName: 'Update',
      actions: [
        cdnUpdate,
      ],
    };
    new Pipeline(this, 'GithubNpmWebDistributionPipeline', {
      stages: [
        sourceStage,
        buildStage,
        deployStage,
        updateStage,
      ]
    });
  }

}
