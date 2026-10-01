import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/extension.ts', 'src/worker.ts'],
  bundle: true,
  outdir: 'dist',
});
