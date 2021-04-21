import { Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { CfnRealtimeLogConfig } from '@aws-cdk/aws-cloudfront';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

export class StaticSiteStack extends Stack {

  public readonly sourceBucket: Bucket;

  constructor(scope: Construct, id: string, logStreamConfig: CfnRealtimeLogConfig.KinesisStreamConfigProperty,
      props?: StackProps) {
    super(scope, id, props);
    const staticSite = new CloudFrontToS3(this, 'StaticSite', {
      insertHttpSecurityHeaders: false,
    });
    this.sourceBucket = staticSite.s3Bucket as Bucket;
    const endPoint = {
      kinesisStreamConfig: logStreamConfig,
      streamType: 'Kinesis',
    }
    new CfnRealtimeLogConfig(this, 'StaticSiteLog', {
      endPoints: [
        endPoint
      ],
      fields: [
        'timestamp',
        'c-ip',
        'cs-user-agent',
      ],
      name: 'StaticSiteLog',
      samplingRate: 100,
    })
    new CfnOutput(this, 'siteURL', {
      value: 'https://' + staticSite.cloudFrontWebDistribution.domainName,
    });
  }

}
