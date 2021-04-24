import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { WebsiteInfraPipelineStack } from '../lib/website-infra-pipeline-stack';

test('Empty Stack', () => {
    const app = new App();
    // WHEN
    const stack = new WebsiteInfraPipelineStack(app, 'WebsiteInfraPipeline');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
