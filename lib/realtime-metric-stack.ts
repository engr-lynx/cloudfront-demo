import { Construct, Stack, StackProps, Arn, Duration, CustomResource } from '@aws-cdk/core';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Provider } from '@aws-cdk/custom-resources';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';

export interface MetricProps {
  distributionId: string,
}

export class RealtimeMetricStack extends Stack {

  constructor(scope: Construct, id: string, metricProps: MetricProps, props?: StackProps) {
    super(scope, id, props);
    const subscriptionPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cloudfront:CreateMonitoringSubscription',
        'cloudfront:DeleteMonitoringSubscription',
      ],
      resources: [
        '*',
      ],
    });
    const functionName = 'SubscriptionHandler';
    const logGroupArn = Arn.format({
      service: 'logs',
      resource: 'log-group',
      sep: ':',
      resourceName: '*',
    }, this);
    const logGroupPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
      ],
      resources: [
        logGroupArn,
      ],
    });
    const logStreamArn = Arn.format({
      service: 'logs',
      resource: 'log-group:/aws/lambda/'.concat(functionName),
      sep: ':',
      resourceName: '*',
    }, this);
    const logStreamPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        logStreamArn,
      ],
    });
    const subscriptionHandler = new Function(this, functionName, {
      functionName,
      runtime: Runtime.PYTHON_3_8,
      handler: 'realtime_metric.on_event',
      code: Code.fromAsset(`${__dirname}/handler`),
      timeout: Duration.minutes(1),
      logRetention: RetentionDays.ONE_DAY,
      initialPolicy: [
        subscriptionPolicy,
        logGroupPolicy,
        logStreamPolicy,
      ],
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
