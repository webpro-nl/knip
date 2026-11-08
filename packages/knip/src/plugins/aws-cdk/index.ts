import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { isDirectory } from '../../util/fs.ts';
import { toDeferResolve } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { AwsCdkConfig } from './types.ts';

// https://docs.aws.amazon.com/cdk/v2/guide/cli.html#cli-config
// https://github.com/aws/aws-cdk-cli/blob/aws-cdk@v2.1147.0/packages/aws-cdk/lib/cxapp/exec.ts#L46-L73
// https://github.com/aws/aws-cdk-cli/blob/aws-cdk@v2.1147.0/packages/aws-cdk/lib/cli/cli.ts#L241-L250

const title = 'AWS CDK';

const enablers = ['aws-cdk', 'aws-cdk-lib'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['cdk.json'];

const resolveConfig: ResolveConfig<AwsCdkConfig> = (localConfig, options) => {
  const scripts = [localConfig.build, localConfig.app].filter((script): script is string => typeof script === 'string');
  const inputs = options.getInputsFromScripts(scripts, { optionalBinaries: true, cwd: options.configFileDir });
  for (const id of localConfig.plugin ?? []) inputs.push(toDeferResolve(id));
  return inputs;
};

const args: Args = {
  binaries: ['cdk'],
  string: ['app'],
  alias: { app: ['a'] },
  // a lone word or an existing directory is a cloud assembly or a file to run; return words so a quoted command is re-parsed
  fromArgs: (parsed, _, { cwd }) =>
    typeof parsed.app === 'string' && parsed.app.includes(' ') && !isDirectory(toAbsolute(parsed.app, cwd))
      ? parsed.app.split(' ')
      : [],
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
