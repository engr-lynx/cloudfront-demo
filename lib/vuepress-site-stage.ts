import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { VuepressPipelineStack } from './vuepress-pipeline-stack';
import { StaticSiteStack } from './static-site-stack';
import { RealtimeLogStack, StreamConfig } from './realtime-log-stack';

/**
 * Deployable unit of Vuepress site
 */
export class VuepressSiteStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const realtimeLog = new RealtimeLogStack(this, 'RealtimeLog');
    const staticSite = new StaticSiteStack(this, 'StaticSite', realtimeLog.logStreamConfig);
    staticSite.addDependency(realtimeLog);
    const vuepressPipeline = new VuepressPipelineStack(this, 'VuepressPipeline', staticSite.sourceBucket);
    vuepressPipeline.addDependency(staticSite);
  }

}