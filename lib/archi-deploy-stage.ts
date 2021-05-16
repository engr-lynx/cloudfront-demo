import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { PipelineCacheStack } from './pipeline-cache-stack';
import { RepoCdnPipelineStack } from './repo-cdn-pipeline-stack';
import { CdnStack } from './cdn-stack';
import { RealtimeMetricStack } from './realtime-metric-stack';
import { RealtimeLogStack } from './realtime-log-stack';
import { buildRepoProps } from './pipeline-helper';

/**
 * Deployable unit of entire architecture
 */
export class ArchiDeployStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const siteEnv = {
      region: 'us-east-1', // use us-east-1 for distribution and supporting services
    };
    const site = new CdnStack(this, 'Site', {
      env: siteEnv,
    });
    const sitePipelineCache = new PipelineCacheStack(this, 'SitePipelineCache', {
      env: siteEnv,
    });
    const sitePipelineContext = this.node.tryGetContext('SitePipeline');
    const siteRepoProps = buildRepoProps(sitePipelineContext);
    new RepoCdnPipelineStack(this, 'SitePipeline', {
      repoProps: siteRepoProps,
      distributionSource: site.sourceBucket,
      distributionId: site.distributionId,
      pipelineCache: sitePipelineCache.bucket,
      enableTestStage: sitePipelineContext.enableTestStage,
      env: siteEnv,
    });
    new RealtimeMetricStack(this, 'RealtimeMetric', {
      distributionId: site.distributionId,
      env: siteEnv,
    });
    // ToDo: put the parameters in context
    new RealtimeLogStack(this, 'RealtimeLog', {
      distributionId: site.distributionId,
      fields: [
        'timestamp',
        'c-ip',
        'sc-status',
        'sc-bytes',
        'cs-uri-stem',
        'cs-user-agent',
      ],
      samplingRate: 100,
      env: siteEnv,
    });
  }

}
