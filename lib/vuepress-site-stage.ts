import { Construct, Stage, StageProps } from '@aws-cdk/core';
import { VuepressPipelineStack } from './vuepress-pipeline-stack';
import { StaticSiteStack } from './static-site-stack';

/**
 * Deployable unit of Vuepress site
 */
export class VuepressSiteStage extends Stage {

  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const staticSite = new StaticSiteStack(this, 'StaticSite');
    const vuepressPipeline = new VuepressPipelineStack(this, 'VuepressPipeline', staticSite.sourceBucket);
    vuepressPipeline.addDependency(staticSite);
  }

}