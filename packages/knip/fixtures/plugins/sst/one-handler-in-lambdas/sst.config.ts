import { SSTConfig } from "sst";
import { d } from "dependencyFromConfig";
import { MyStack } from "./src/stacks/my-stack";
// import a stack

export default {
  config(_input) {
    return {
      name: "MyService",
      region: "eu-west-2",
      stage: "production",
    };
  },
  stacks(app) {
    app.stack(MyStack);
  },
} satisfies SSTConfig;
