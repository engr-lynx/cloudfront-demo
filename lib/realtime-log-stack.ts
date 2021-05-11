import { join } from 'path';
import { Construct, Stack, StackProps, Arn, Duration, CustomResource, PhysicalName } from '@aws-cdk/core';
import { Stream, StreamEncryption } from '@aws-cdk/aws-kinesis';
import { Role, ServicePrincipal, PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { CfnRealtimeLogConfig } from '@aws-cdk/aws-cloudfront';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Provider } from '@aws-cdk/custom-resources';
import { RetentionDays } from '@aws-cdk/aws-logs';

export interface RealtimeLogProps extends StackProps {
  distributionId: string,
  fields: string[],
  samplingRate: number,
}

export class RealtimeLogStack extends Stack {

  constructor(scope: Construct, id: string, realtimeLogProps: RealtimeLogProps) {
    super(scope, id, realtimeLogProps);
    const logStream = new Stream(this, 'LogStream', {
      shardCount: 1,
      encryption: StreamEncryption.UNENCRYPTED,
    });
    
    const streamArn = Arn.format({
      service: 'kinesis',
      resource: 'stream',
      resourceName: logStream.streamName,
    }, this);
    const rolePrincipal = new ServicePrincipal('cloudfront.amazonaws.com')
    const logRole = new Role(this, 'LogRole', {
      assumedBy: rolePrincipal,
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
      resourceName: logRole.roleName,
    }, this);
    const logConfig = {
      streamArn,
      roleArn,
    }
    const endPoint = {
      kinesisStreamConfig: logConfig,
      streamType: 'Kinesis',
    }
    new CfnRealtimeLogConfig(this, 'LogConfig', {
      name: PhysicalName.GENERATE_IF_NEEDED,
      endPoints: [
        endPoint,
      ],
      fields: realtimeLogProps.fields,
      samplingRate: realtimeLogProps.samplingRate,
    });
    const distributionArn = Arn.format({
      service: 'cloudfront',
      resource: 'distribution',
      region: '',
      resourceName: realtimeLogProps.distributionId,
    }, this);
    const logPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cloudfront:GetDistributionConfig',
        'cloudfront:UpdateDistribution',
      ],
      resources: [
        distributionArn,
      ],
    });
    const logHandler = new Function(this, 'LogHandler', {
      runtime: Runtime.PYTHON_3_8,
      handler: 'log.on_event',
      code: Code.fromAsset(join(__dirname, 'log-handler')),
      timeout: Duration.minutes(1),
      logRetention: RetentionDays.ONE_DAY,
      initialPolicy: [
        logPolicy,
      ],
    });
    const logProvider = new Provider(this, 'LogProvider', {
      onEventHandler: logHandler,
      logRetention: RetentionDays.ONE_DAY,
    });
    const logProps = {
      distributionId: realtimeLogProps.distributionId,
    }
    new CustomResource(this, 'LogResource', {
      serviceToken: logProvider.serviceToken,
      properties: logProps,
    });

  }

}
