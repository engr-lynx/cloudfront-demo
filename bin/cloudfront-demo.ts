#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { CloudfrontDemoStack } from '../lib/cloudfront-demo-stack';

const app = new App();
new CloudfrontDemoStack(app, 'CloudfrontDemoStack', {});
app.synth();
