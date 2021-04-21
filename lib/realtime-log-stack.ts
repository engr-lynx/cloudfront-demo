import { Construct, Stack, StackProps, CfnOutput, Arn } from '@aws-cdk/core';
import { Stream } from '@aws-cdk/aws-kinesis';
import { Role, ServicePrincipal, PolicyStatement } from '@aws-cdk/aws-iam';

export interface StreamConfig {
  streamArn: string,
  roleArn: string,
}

export class RealtimeLogStack extends Stack {

  public readonly logStreamConfig: StreamConfig;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const logStreamName = 'LogStream'
    const logStream = new Stream(this, logStreamName, {
      shardCount: 1,
      streamName: logStreamName,
    });
    const logStreamArn = Arn.format({
      resource: 'stream',
      service: 'kinesis',
      resourceName: logStreamName,
    }, this);
    const logStreamRoleName = 'LogStreamRole';
    const role = new Role(this, logStreamRoleName, {
      assumedBy: new ServicePrincipal('cloudfront.amazonaws.com'),
      roleName: logStreamRoleName,
    });
    role.addToPolicy(new PolicyStatement({
      resources: [
        logStreamArn
      ],
      actions: [
          'kinesis:DescribeStreamSummary',
          'kinesis:DescribeStream',
          'kinesis:PutRecord',
          'kinesis:PutRecords',
        ],
      })
    );
    const logStreamRoleArn = Arn.format({
      resource: 'role',
      service: 'iam',
      resourceName: logStreamRoleName,
    }, this);
    this.logStreamConfig = {
      streamArn: logStreamArn,
      roleArn: logStreamRoleArn,
    }
    new CfnOutput(this, 'logStreamArn', {
      value: logStreamArn,
    });
    new CfnOutput(this, 'kibanaURL', {
      value: '',
    });
  }

}
