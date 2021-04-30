import { join } from 'path';
import { Construct, Stack, StackProps, Duration, CustomResource } from '@aws-cdk/core';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Provider } from '@aws-cdk/custom-resources';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';

export interface RealtimeMetricProps {
  distributionId: string,
}

export class RealtimeMetricStack extends Stack {

  constructor(scope: Construct, id: string, realtimeMetricProps: RealtimeMetricProps, props?: StackProps) {
    super(scope, id, props);
    const metricPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'cloudfront:CreateMonitoringSubscription',
        'cloudfront:DeleteMonitoringSubscription',
      ],
      resources: [
        '*',
      ],
    });
    const metricHandler = new Function(this, 'MetricHandler', {
      runtime: Runtime.PYTHON_3_8,
      handler: 'metric.on_event',
      code: Code.fromAsset(join(__dirname, 'metric-handler')),
      timeout: Duration.minutes(1),
      logRetention: RetentionDays.ONE_DAY,
      initialPolicy: [
        metricPolicy,
      ],
    });
    const metricProvider = new Provider(this, 'MetricProvider', {
      onEventHandler: metricHandler,
      logRetention: RetentionDays.ONE_DAY,
    });
    new CustomResource(this, 'MetricResource', {
      serviceToken: metricProvider.serviceToken,
      properties: realtimeMetricProps,
    });
  }

}
