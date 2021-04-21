import { Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export class StaticSiteStack extends Stack {

  public readonly sourceBucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const construct = new CloudFrontToS3(this, 'CloudFrontToS3', {
      insertHttpSecurityHeaders: false,
    });
    new CfnOutput(this, 'siteURL', {
      value: 'https://' + construct.cloudFrontWebDistribution.domainName,
    });
    this.sourceBucket = construct.s3Bucket as Bucket;
  }

}
