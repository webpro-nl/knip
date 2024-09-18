---
title: Issue Reproduction
---

If you encounter an issue or false positives when using Knip, you can [open an
issue on GitHub][1]. This will help you in your project, and will also improve
Knip for everyone else!

There are many factors that may influence the issue at hand, such as:

- Code syntax, import and export structure in source files
- Dependencies, scripts and entry files in `package.json`
- TypeScript configuration in `tsconfig.json`
- Enabled plugins and configuration files for that tooling
- Dependent or depending workspaces in a monorepo
- Knip configuration in `knip.json`

Think of Knip like a kitchen sink, it handles a large amount of projects and
configurations, and your project is different from all others. That's why it's
required to provide a minimal reproduction. This contains only the source code
and configuration required to demonstrate the issue. Providing this with a clear
issue description will help us help you, and greatly improves the chances your
issue will be looked into efficiently and in a timely manner.

Issues containing just a screenshot, a snippet of output, or a snippet of source
code don't tell the full picture. Only an actual reproduction of the issue with
source code and configuration is complete and actionable.

## Before opening an issue

Before opening an issue, please make sure you:

- are using the latest version
- have read the relevant documentation
- have searched [existing issues][1]
- have checked the list of [known issues][2]

Please file only a single issue at a time, so each of them can be labeled and
tracked separately.

## Templates

A convenient way to create a minimal reproduction so is by starting with one of
these templates in CodeSandbox or StackBlitz:

| Template |                  |                 |
| :------- | ---------------- | --------------- |
| Basic    | [CodeSandbox][3] | [StackBlitz][4] |
| Monorepo | [CodeSandbox][5] | [StackBlitz][6] |

Shoutout to [CodeSandbox][7] and [StackBlitz][8] for generously providing these
free dev containers!

Other solutions may work well too. For instance, many people choose to create a
small repository on GitHub. The goal is to have an easy and common understanding
and reproduction.

Providing a link to your existing project repository will likely not be
considered "minimal".

## Pull Request

The optimal way is to add fixtures and/or failing tests to the Knip repository,
and open a pull request to discuss the issue! Also see [instructions for
development][9].

[1]: https://github.com/webpro-nl/knip/issues?q=is%3Aissue
[2]: https://knip.dev/reference/known-issues
[3]:
  https://codesandbox.io/p/devbox/github/webpro-nl/knip/main/templates/issue-reproduction/basic
[4]:
  https://stackblitz.com/github/webpro-nl/knip/tree/main/templates/issue-reproduction/basic
[5]:
  https://codesandbox.io/p/devbox/github/webpro-nl/knip/main/templates/issue-reproduction/monorepo
[6]:
  https://stackblitz.com/github/webpro-nl/knip/tree/main/templates/issue-reproduction/monorepo
[7]: https://codesandbox.io
[8]: https://stackblitz.com
[9]: https://github.com/webpro-nl/knip/blob/main/.github/DEVELOPMENT.md
