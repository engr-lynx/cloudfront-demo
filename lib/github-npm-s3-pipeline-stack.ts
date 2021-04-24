import { Construct, Stack, StackProps, SecretValue } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction, S3DeployAction } from '@aws-cdk/aws-codepipeline-actions';

export interface GithubNpmS3PipelineProps {
  githubTokenName: string,
  githubOwner: string,
  githubRepo: string,
  npmArtifactDir: string,
  npmArtifactFiles: string,
  s3Bucket: Bucket,
}

export class GithubNpmS3PipelineStack extends Stack {

  constructor(scope: Construct, id: string, githubNpmS3PipelineProps: GithubNpmS3PipelineProps, props?: StackProps) {
    super(scope, id, props);
    const githubOutput = new Artifact('GithubOutput');
    const githubToken = SecretValue.secretsManager(githubNpmS3PipelineProps.githubTokenName);
    const githubSource = new GitHubSourceAction({
      actionName: 'GithubSource',
      output: githubOutput,
      oauthToken: githubToken,
      owner: githubNpmS3PipelineProps.githubOwner,
      repo: githubNpmS3PipelineProps.githubRepo,
    });
    const sourceStage = {
      stageName: 'Source',
      actions: [
        githubSource,
      ],
    }
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
        'base-directory': githubNpmS3PipelineProps.npmArtifactDir,
        files: githubNpmS3PipelineProps.npmArtifactFiles,
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
    })
    const buildStage = {
      stageName: 'Build',
      actions: [
        npmBuild,
      ],
    }
    const s3Deploy = new S3DeployAction({
      actionName: 'S3Deploy',
      input: npmOutput,
      bucket: githubNpmS3PipelineProps.s3Bucket,
    })
    const deployStage = {
      stageName: 'Deploy',
      actions: [
        s3Deploy,
      ],
    }
    new Pipeline(this, 'GithubNpmS3Pipeline', {
      stages: [
        sourceStage,
        buildStage,
        deployStage,
      ]
    });
  }

}
