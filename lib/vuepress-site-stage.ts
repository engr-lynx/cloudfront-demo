import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { GithubNpmS3PipelineStack } from './github-npm-s3-pipeline-stack';
import { WebDistributionStack } from './web-distribution-stack';
import { RealtimeMetricStack } from './realtime-metric-stack';
import { RealtimeLogStack } from './realtime-log-stack';

/**
 * Deployable unit of Vuepress site
 */
export class VuepressSiteStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const website = new WebDistributionStack(this, 'Website');
    new GithubNpmS3PipelineStack(this, 'VuepressPipeline', {
      githubTokenName: 'github-token',
      githubOwner: 'engr-lynx',
      githubRepo: 'vuepress-homepage',
      npmArtifactDir: 'dist',
      npmArtifactFiles: '**/*',
      s3Bucket: website.sourceBucket,
    });
    new RealtimeMetricStack(this, 'RealtimeMetric', {
      distributionId: website.distributionId,
    })
    new RealtimeLogStack(this, 'RealtimeLog', {
      distributionId: website.distributionId,
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