import { Artifact } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import { VuepressSiteStage } from './vuepress-site-stage';

/**
 * The stack that defines the application pipeline
 */
export class CloudFrontDemoPipelineStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();
    const pipeline = new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'WebsitePipeline',
      cloudAssemblyArtifact,
      sourceAction: new GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('github-token'),
        owner: 'engr-lynx',
        repo: 'cloudfront-demo',
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,
        environment: { buildImage: LinuxBuildImage.STANDARD_5_0 },
        buildCommand: 'npm run build',
      }),
    });

    // This is where we add the application stages
    // ...
    pipeline.addApplicationStage(new VuepressSiteStage(this, 'VuepressSiteProd'));
  }

}