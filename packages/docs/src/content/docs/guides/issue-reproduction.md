---
title: Issue Reproduction
---

If you encounter an issue or false positives when using Knip, you can [open an
issue on GitHub][1]. This will help you in your project, and will also improve
Knip for everyone else!

Since many factors may influence the issue at hand, in most cases you'll be
asked to provide a minimal reproduction. This contains only the source code and
configuration required to demonstrate the issue. Providing this with a clear
issue description will help us help you, and greatly improves the chances your
issue will be looked into efficiently and in a timely manner.

Issues containing just a screenshot, a snippet of output, or a snippet of source
code don't tell the full picture. Only an actual reproduction of the issue with
source code and configuration is complete and actionable.

### Before opening an issue

Before opening an issue, please make sure you..

- have searched [open issues][1] for the same.
- have checked the list of [known issues][2].
- are using the latest version.
- have read the documentation.

Please file only a single issue at a time, so each of them can be labeled and
tracked separately.

### Templates

A convenient way to create a minimal reproduction so is by starting with one of
these templates in CodeSandbox or StackBlitz:

| Template |                  |                 |
| :------- | ---------------- | --------------- |
| Basic    | [CodeSandbox][3] | [StackBlitz][4] |
| Monorepo | [CodeSandbox][5] | [StackBlitz][6] |

Other solutions may work well too. For instance, many people choose to create a
small repository on GitHub. The goal is to have an easy and common understanding
and reproduction.

Providing a link to your repository will likely not be considered "minimal".

### Pull Request

The optimal way is to add fixtures and/or failing tests to the Knip repository,
and open a pull request to discuss the issue! Also see [instructions for
development][7].

[1]: https://github.com/webpro-nl/knip/issues
[2]: https://knip.dev/reference/known-issues
[3]:
  https://codesandbox.io/p/devbox/github/webpro-nl/knip/main/templates/issue-reproduction/basic
[4]:
  https://stackblitz.com/github/webpro-nl/knip/tree/main/templates/issue-reproduction/basic
[5]:
  https://codesandbox.io/p/devbox/github/webpro-nl/knip/main/templates/issue-reproduction/monorepo
[6]:
  https://stackblitz.com/github/webpro-nl/knip/tree/main/templates/issue-reproduction/monorepo
[7]: https://github.com/webpro-nl/knip/blob/main/.github/DEVELOPMENT.md
