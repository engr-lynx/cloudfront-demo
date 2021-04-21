import { Construct, Stack, StackProps, SecretValue, CfnOutput } from '@aws-cdk/core';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';
import { PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';

export class CloudFrontS3Stack extends Stack {

  public readonly URL: CfnOutput;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const construct = new CloudFrontToS3(this, 'CloudFrontToS3', {
      insertHttpSecurityHeaders: false,
    });
    const sourceArtifact = new Artifact();
    const oauthToken = SecretValue.secretsManager('github-token');
    const sourceAction = new GitHubSourceAction({
      actionName: 'Github',
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
        files: [
          'node_modules/**/*',
        ],
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
    new Pipeline(this, 'VuepressPipeline', {
      stages: [
        sourceStage,
        buildStage,
      ]
    });

    this.URL = new CfnOutput(this, 'URL', {
      value: 'https://' + construct.cloudFrontWebDistribution.domainName,
    });
  }

}
