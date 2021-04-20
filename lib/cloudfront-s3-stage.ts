import { CfnOutput, Construct, Stage, StageProps } from '@aws-cdk/core';
import { CloudFrontS3Stack } from './cloudfront-s3-stack';

/**
 * Deployable unit of CloudFront-S3 solution
 */
export class CloudFrontS3Stage extends Stage {

  public readonly URL: CfnOutput;
  
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);
    const service = new CloudFrontS3Stack(this, 'CloudFront-S3');
    this.URL = service.URL;
  }

}