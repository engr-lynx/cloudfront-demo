import { Construct, Stack, StackProps, Duration, CustomResource } from '@aws-cdk/core';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Provider } from '@aws-cdk/custom-resources';
import { RetentionDays } from '@aws-cdk/aws-logs';
//import { PolicyStatement } from '@aws-cdk/aws-iam';

export interface MetricProps {
  distributionId: string,
}

export class RealtimeMetricStack extends Stack {

  constructor(scope: Construct, id: string, metricProps: MetricProps, props?: StackProps) {
    super(scope, id, props);

    const subscriptionHandler = new Function(this, 'SubscriptionHandler', {
      runtime: Runtime.PYTHON_3_8,
      handler: 'realtime_metric.on_event',
      code: Code.fromAsset(`${__dirname}/handler`),
      timeout: Duration.minutes(1),
      initialPolicy: [
        // new PolicyStatement({
        //   actions: ["s3:GetObject",
        //     "s3:ListBucket"],
        //   resources: [`arn:${Aws.PARTITION}:s3:::${sourceBucket}`,
        //   `arn:aws:s3:::${sourceBucket}/${sourcePrefix}*`]
        // }),
      ]
    });

    const subscriptionProvider = new Provider(this, 'SubscriptionProvider', {
      onEventHandler: subscriptionHandler,
      logRetention: RetentionDays.ONE_DAY,
    });
    const subscriptionProps = {
      DistributionId: metricProps.distributionId,
    }
    new CustomResource(this, 'SubscriptionResource', {
      serviceToken: subscriptionProvider.serviceToken,
      properties: subscriptionProps,
    });
  }

}
