// @ts-ignore
import * as cdk from 'aws-cdk-lib';
import { MyStack } from '../lib/myStack';

const app = new cdk.App();
new MyStack(app, 'MyStack');

app.synth();