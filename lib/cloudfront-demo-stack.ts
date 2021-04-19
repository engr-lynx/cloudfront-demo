import { Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export class CloudfrontDemoStack extends Stack {

  public readonly websiteURL: CfnOutput;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const construct = new CloudFrontToS3(this, 'CloudFrontToS3', {
      insertHttpSecurityHeaders: false,
    });
    this.websiteURL = new CfnOutput(this, 'websiteURL', {
      value: 'https://' + construct.cloudFrontWebDistribution.domainName,
    });
  }

}
