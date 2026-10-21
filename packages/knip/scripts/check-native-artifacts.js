import { parseArgs } from 'node:util';
import { expectedRevision, releaseTargets, validateArtifacts } from './native-artifacts.js';

const { values } = parseArgs({
  options: { publish: { type: 'boolean' }, directory: { type: 'string' }, revision: { type: 'string' } },
});
const targets = validateArtifacts({
  directory: values.directory,
  strict: values.publish,
  required: values.publish ? releaseTargets : [],
  revision: values.revision || (values.publish ? expectedRevision() : undefined),
});
console.log(
  `Validated ${targets.length} native artifact(s) for ${values.publish ? 'publication' : 'local packaging'}.`
);
