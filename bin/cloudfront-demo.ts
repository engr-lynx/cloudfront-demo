#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { CloudFrontDemoPipelineStack } from '../lib/cloudfront-demo-pipeline-stack';

const app = new App();
new CloudFrontDemoPipelineStack(app, 'CloudFrontDemoPipelineStack');
app.synth();
