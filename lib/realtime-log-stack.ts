import { Construct, Stack, StackProps, Arn } from '@aws-cdk/core';
import { Stream, StreamEncryption } from '@aws-cdk/aws-kinesis';
import { Role, ServicePrincipal, PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { CfnRealtimeLogConfig } from '@aws-cdk/aws-cloudfront';

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
  }

}
