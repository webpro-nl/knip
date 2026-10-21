import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import posix from 'node:path/posix';
import win32 from 'node:path/win32';
import { fileURLToPath } from 'node:url';

const path = process.platform === 'win32' ? win32 : posix;

export async function bundleWasi(directory, rolldown) {
  const build = await rolldown({
    input: fileURLToPath(new URL('./wasi-runtime.cjs', import.meta.url)),
    platform: 'node',
  });
  try {
    await build.write({
      format: 'cjs',
      codeSplitting: false,
      file: path.join(directory, 'knip-native.wasi-runtime.cjs'),
    });
  } finally {
    await build.close();
  }
  for (const name of ['knip-native.wasi.cjs', 'wasi-worker.mjs']) {
    const file = path.join(directory, name);
    const source = readFileSync(file, 'utf8');
    const runtimeImport = "require('@napi-rs/wasm-runtime')";
    if (!source.includes(runtimeImport)) throw new Error(`Missing WASI runtime import in ${name}`);
    writeFileSync(
      file,
      source
        .replaceAll(runtimeImport, "require('./knip-native.wasi-runtime.cjs')")
        .replaceAll("require('@emnapi/runtime')", "require('./knip-native.wasi-runtime.cjs')")
    );
  }
  copyFileSync(new URL('./wasi-runtime.LICENSE', import.meta.url), path.join(directory, 'wasi-runtime.LICENSE'));
}
