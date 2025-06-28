// @ts-ignore
import * as cdk from 'aws-cdk-lib';
// @ts-ignore
import * as s3 from 'aws-cdk-lib/aws-s3';
import { MyConstruct } from './my-construct';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    const newConstruct = new MyConstruct(this, 'MyConstruct');

    // The code that defines your stack goes here
    new s3.Bucket(this, 'MyFirstBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Not for production
      autoDeleteObjects: true,
    });

  }
}

