import { Construct, Stack, StackProps, CfnOutput, Arn } from '@aws-cdk/core';
import { Stream } from '@aws-cdk/aws-kinesis';

export class RealtimeLogStack extends Stack {

  public readonly logStreamArn: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logStreamName = 'LogStream'
    const logStream = new Stream(this, logStreamName, {
      shardCount: 1,
    });

    new CfnOutput(this, 'kibanaURL', {
      value: '',
    });
    this.logStreamArn = Arn.format({
      resource: 'stream',
      service: 'kinesis',
      resourceName: logStreamName,
    }, this);
    new CfnOutput(this, 'logStreamArn', {
      value: this.logStreamArn,
    });    
  }

}
