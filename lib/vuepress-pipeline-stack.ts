import { Construct, Stack, StackProps, SecretValue } from '@aws-cdk/core';
import { IBucket } from '@aws-cdk/aws-s3';
import { PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction, S3DeployAction } from '@aws-cdk/aws-codepipeline-actions';

export class VuepressPipelineStack extends Stack {

  constructor(scope: Construct, id: string, targetBucket: IBucket, props?: StackProps) {
    super(scope, id, props);
    const sourceArtifact = new Artifact();
    const oauthToken = SecretValue.secretsManager('github-token');
    const sourceAction = new GitHubSourceAction({
      actionName: 'VuepressSource',
      output: sourceArtifact,
      oauthToken,
      owner: 'engr-lynx',
      repo: 'vuepress-homepage',
    });
    const sourceStage = {
      stageName: 'Source',
      actions: [
        sourceAction
      ],
    }
    const buildSpec = BuildSpec.fromObject({
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
        'base-directory': 'dist',
        files: '**/*',
      },
    });
    const buildImage = LinuxBuildImage.STANDARD_5_0;
    const environment = {
      buildImage
    };
    const buildProject = new PipelineProject(this, 'VuepressProject', {
      buildSpec,
      environment,
    });
    const vuepressBuildOutput = new Artifact('VuepressBuildOutput');
    const buildAction = new CodeBuildAction({
      actionName: 'VuepressBuild',
      project: buildProject,
      input: sourceArtifact,
      outputs: [
        vuepressBuildOutput,
      ],
    })
    const buildStage = {
      stageName: 'Build',
      actions: [
        buildAction
      ],
    }
    const deployAction = new S3DeployAction({
      actionName: 'VuepressDeploy',
      input: vuepressBuildOutput,
      bucket: targetBucket,
    })
    const deployStage = {
      stageName: 'Deploy',
      actions: [
        deployAction
      ],
    }
    const pipeline = new Pipeline(this, 'VuepressPipeline', {
      stages: [
        sourceStage,
        buildStage,
        deployStage,
      ]
    });
  }

}
