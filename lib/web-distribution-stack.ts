import { Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export class WebDistributionStack extends Stack {

  public readonly sourceBucket: Bucket;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const webDistribution = new CloudFrontToS3(this, 'WebDistribution', {});
    this.sourceBucket = webDistribution.s3Bucket as Bucket;
    this.distributionId = webDistribution.cloudFrontWebDistribution.distributionId;
    new CfnOutput(this, 'URL', {
      value: 'https://' + webDistribution.cloudFrontWebDistribution.domainName,
    });
  }

}
