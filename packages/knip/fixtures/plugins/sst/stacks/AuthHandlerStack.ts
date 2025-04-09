import sst from 'sst';
import { d } from 'sst-auth-handler-stack-dep';
import { use, StackContext, Function, FunctionProps } from 'sst/constructs';

export function AuthHandlerStack({ stack, app }: StackContext) {
  new sst.aws.Function('MyFunction', {
    handler: 'handlers/other-auth.handler',
    timeout: '3 minutes',
    memory: '1024 MB',
  });

  return {
    handler,
  };
}
