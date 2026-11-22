import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://github.com/firebase/firebase-tools/blob/bd1d9f917594e3f9c2c4aa57fe0d2df71d6aaaa6/src/commands/emulators-exec.ts

const title = 'Firebase';

const args: Args = {
  binaries: ['firebase', 'firebase-tools'],
  boolean: ['debug', 'interactive', 'json', 'non-interactive', 'ui'],
  alias: { interactive: ['i'], json: ['j'] },
  fromArgs: parsed => (parsed._[0] === 'emulators:exec' && parsed._[1] ? parsed._[1] : []),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;
