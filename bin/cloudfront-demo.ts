#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { WebsiteInfraPipelineStack } from '../lib/website-infra-pipeline-stack';

const app = new App();
const appEnv = {
  region: 'us-east-1',
}
new WebsiteInfraPipelineStack(app, 'CloudFrontDemoPipeline', {
  githubTokenName: 'github-token',
  githubOwner: 'engr-lynx',
  githubRepo: 'cloudfront-demo',
}, {
  env: appEnv,
});
app.synth();
