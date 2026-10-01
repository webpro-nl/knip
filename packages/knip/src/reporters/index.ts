import codeclimate from './codeclimate.ts';
import codeowners from './codeowners.ts';
import compact from './compact.ts';
import cycles from './cycles.ts';
import disclosure from './disclosure.ts';
import githubActions from './github-actions.ts';
import json from './json.ts';
import markdown from './markdown.ts';
import sarif from './sarif.ts';
import symbols from './symbols.ts';

export default {
  symbols,
  compact,
  codeowners,
  cycles,
  disclosure,
  codeclimate,
  json,
  markdown,
  sarif,
  'github-actions': githubActions,
};
