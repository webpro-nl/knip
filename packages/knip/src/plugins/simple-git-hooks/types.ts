// https://github.com/toplenboren/simple-git-hooks?tab=readme-ov-file#additional-configuration-options
// {
//   "pre-commit": "npx lint-staged",
//   "pre-push": "npm run format"
// }
type Config = Record<string, string>;

export type SimpleGitHooksConfig = Config | (() => Config);
