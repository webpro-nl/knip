// @ts-ignore
import * as cdk from 'aws-cdk-lib';
// @ts-ignore
import { Template } from 'aws-cdk-lib/assertions';
import { MyStack } from '../lib/my-stack';

// @ts-ignore
test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::S3::Bucket', {
    VersioningConfiguration: {
      Status: 'Enabled',
    },
  });
});