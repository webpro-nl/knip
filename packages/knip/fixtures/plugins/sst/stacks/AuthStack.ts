import sst from 'sst';
import 'sst-auth-stack-dep';
import { StackContext, Function, FunctionProps } from 'sst/constructs';

export function AuthStack({ stack, app }: StackContext) {
  // Create single Lambda handler
  const handlerProps: FunctionProps = {
    handler: 'handlers/auth.handler',
    permissions: ['perm1', 'perm2'],
  };

  const handler = new Function(stack, 'MyHandler', handlerProps);

  return {
    handler,
  };
}
