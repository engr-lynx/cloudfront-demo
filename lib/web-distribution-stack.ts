import { Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export class WebDistributionStack extends Stack {

  public readonly sourceBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const webDistribution = new CloudFrontToS3(this, 'WebDistribution', {
      insertHttpSecurityHeaders: false, // implemented using Lambda@Edge w/c can only be used in us-east-1
    });
    this.sourceBucket = webDistribution.s3Bucket as Bucket;
    new CfnOutput(this, 'URL', {
      value: 'https://' + webDistribution.cloudFrontWebDistribution.domainName,
    });
  }

}
