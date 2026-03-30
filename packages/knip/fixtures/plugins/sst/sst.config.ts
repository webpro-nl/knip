import { sst, SSTConfig } from 'sst';
import { d } from 'sst-config-dep';
import { AuthStack } from './stacks/AuthStack';
import { AuthHandlerStack } from './stacks/AuthHandlerStack';

new sst.aws.Function('MyFunction', {
  handler: 'handlers/some-route.handler', // v3
  environment: {
    ACCOUNT: aws.getCallerIdentityOutput({}).accountId,
    REGION: aws.getRegionOutput().name,
  },
});

export default {
  config(_input) {
    return {
      name: 'MyService',
      region: 'eu-west-2',
      stage: 'production',
    };
  },
  stacks(app) {
    app.stack(AuthStack).stack(AuthHandlerStack); // v2
  },
} satisfies SSTConfig;
