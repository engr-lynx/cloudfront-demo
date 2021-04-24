import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { GithubNpmS3PipelineStack } from './github-npm-s3-pipeline-stack';
import { WebDistributionStack } from './web-distribution-stack';
import { RealtimeLogStack } from './realtime-log-stack';

/**
 * Deployable unit of Vuepress site
 */
export class VuepressSiteStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const website = new WebDistributionStack(this, 'Website');
    const vuepressPipeline = new GithubNpmS3PipelineStack(this, 'VuepressPipeline', {
      githubTokenName: 'github-token',
      githubOwner: 'engr-lynx',
      githubRepo: 'vuepress-homepage',
      npmArtifactDir: 'dist',
      npmArtifactFiles: '**/*',
      s3Bucket: website.sourceBucket,
    });
    vuepressPipeline.addDependency(website);
    new RealtimeLogStack(this, 'RealtimeLog', {
      fields: [
        'timestamp',
        'c-ip',
        'sc-status',
        'sc-bytes',
        'cs-uri-stem',
        'cs-user-agent',
      ],
      samplingRate: 100,
    });
  }

}