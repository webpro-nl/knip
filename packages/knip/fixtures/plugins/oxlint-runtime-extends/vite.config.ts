import preset from './tooling/preset.ts';

export default { root: './unrelated-root', lint: { extends: [preset, './configs/shared.json'] } };
