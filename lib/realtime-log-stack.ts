import { Construct, Stack, StackProps, Arn, Duration, CustomResource } from '@aws-cdk/core';
import { Stream, StreamEncryption } from '@aws-cdk/aws-kinesis';
import { Role, ServicePrincipal, PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { CfnRealtimeLogConfig } from '@aws-cdk/aws-cloudfront';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Provider } from '@aws-cdk/custom-resources';
import { RetentionDays } from '@aws-cdk/aws-logs';

export interface LogProps {
  distributionId: string,
  fields: string[],
  samplingRate: number,
}

export class RealtimeLogStack extends Stack {

  constructor(scope: Construct, id: string, logProps: LogProps, props?: StackProps) {
    super(scope, id, props);
    const streamName = 'LogStream';
    new Stream(this, streamName, {
      streamName,
      shardCount: 1,
      encryption: StreamEncryption.UNENCRYPTED,
    });
    const streamArn = Arn.format({
      service: 'kinesis',
      resource: 'stream',
      resourceName: streamName,
    }, this);
    const roleName = 'LogRole';
    const rolePrincipal = new ServicePrincipal('cloudfront.amazonaws.com')
    const logRole = new Role(this, roleName, {
      assumedBy: rolePrincipal,
      roleName,
    });
    const streamPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [
        streamArn,
      ],
      actions: [
        'kinesis:DescribeStreamSummary',
        'kinesis:DescribeStream',
        'kinesis:PutRecord',
        'kinesis:PutRecords',
      ],
    });
    logRole.addToPolicy(streamPolicy);
    const roleArn = Arn.format({
      service: 'iam',
      resource: 'role',
      resourceName: roleName,
    }, this);
    const logConfig = {
      streamArn,
      roleArn,
    }
    const endPoint = {
      kinesisStreamConfig: logConfig,
      streamType: 'Kinesis',
    }
    const configName = 'LogConfig';
    new CfnRealtimeLogConfig(this, configName, {
      name: configName,
      endPoints: [
        endPoint,
      ],
      fields: logProps.fields,
      samplingRate: logProps.samplingRate,
    });

    const distributionArn = Arn.format({
      service: 'cloudfront',
      resource: 'distribution',
      region: '',
      resourceName: logProps.distributionId,
    }, this);
    const subscriptionPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cloudfront:GetDistributionConfig',
        'cloudfront:UpdateDistribution',
      ],
      resources: [
        distributionArn,
      ]
    });
    const subscriptionHandler = new Function(this, 'SubscriptionHandler', {
      runtime: Runtime.PYTHON_3_8,
      handler: 'realtime_log.on_event',
      code: Code.fromAsset(`${__dirname}/handler`),
      timeout: Duration.minutes(1),
      initialPolicy: [
        subscriptionPolicy,
      ]
    });
    const subscriptionProvider = new Provider(this, 'SubscriptionProvider', {
      onEventHandler: subscriptionHandler,
      logRetention: RetentionDays.ONE_DAY,
    });
    const subscriptionProps = {
      DistributionId: logProps.distributionId,
    }
    new CustomResource(this, 'SubscriptionResource', {
      serviceToken: subscriptionProvider.serviceToken,
      properties: subscriptionProps,
    });

  }

}
