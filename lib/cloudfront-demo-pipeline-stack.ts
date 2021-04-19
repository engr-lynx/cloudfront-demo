import { Artifact } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import { Construct, SecretValue, Stack, StackProps } from '@aws-cdk/core';
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";

/**
 * The stack that defines the application pipeline
 */
export class CloudfrontDemoPipelineStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const sourceArtifact = new Artifact();
    const cloudAssemblyArtifact = new Artifact();
    new CdkPipeline(this, 'Pipeline', {
      pipelineName: 'WebsitePipeline',
      cloudAssemblyArtifact,
      sourceAction: new GitHubSourceAction({
        actionName: 'GitHub',
        output: sourceArtifact,
        oauthToken: SecretValue.secretsManager('github-token'),
        owner: 'engr-lynx',
        repo: 'https://github.com/engr-lynx/cloudfront-demo',
      }),
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,         
        buildCommand: 'npm run build'
      }),
    });

    // This is where we add the application stages
    // ...
  }

}