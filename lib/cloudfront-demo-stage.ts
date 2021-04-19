import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { CloudfrontDemoStack } from './cloudfront-demo-stack';

/**
 * Deployable unit of website app
 */
export class CdkpipelinesDemoStage extends Stage {

  public readonly websiteURL: CfnOutput;
  
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const service = new CloudfrontDemoStack(this, 'Website');
    this.websiteURL = service.websiteURL;
  }

}