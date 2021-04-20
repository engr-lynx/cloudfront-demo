#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
//import { CloudfrontDemoStack } from '../lib/cloudfront-demo-stack';
import { CloudfrontDemoPipelineStack } from '../lib/cloudfront-demo-pipeline-stack';

const app = new App();
new CloudfrontDemoPipelineStack(app, 'CloudfrontDemoPipelineStack', {});
app.synth();
