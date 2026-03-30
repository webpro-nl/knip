import codeclimate from './codeclimate.ts';
import codeowners from './codeowners.ts';
import compact from './compact.ts';
import disclosure from './disclosure.ts';
import githubActions from './github-actions.ts';
import json from './json.ts';
import markdown from './markdown.ts';
import symbols from './symbols.ts';

export default {
  symbols,
  compact,
  codeowners,
  disclosure,
  codeclimate,
  json,
  markdown,
  'github-actions': githubActions,
};
