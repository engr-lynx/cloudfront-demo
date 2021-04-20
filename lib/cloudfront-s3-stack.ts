import { Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export class CloudFrontS3Stack extends Stack {

  public readonly URL: CfnOutput;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const construct = new CloudFrontToS3(this, 'CloudFrontToS3', {
      insertHttpSecurityHeaders: false,
    });
    this.URL = new CfnOutput(this, 'URL', {
      value: 'https://' + construct.cloudFrontWebDistribution.domainName,
    });
  }

}
