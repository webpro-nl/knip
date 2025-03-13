import { d } from "dependencyFromStack";
import { use, StackContext, Function, FunctionProps } from "sst/constructs";

export function MyStack({ stack, app }: StackContext) {

  // Create single Lambda handler
  const handlerProps: FunctionProps = {
    handler: "src/handlers/my-handler.handlerFn",
    permissions: ["perm1", "perm2"]
  };

  const handler = new Function(stack, "MyHandler", handlerProps);

  return {
    handler
  };
}
