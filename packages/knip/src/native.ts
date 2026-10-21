import { createRequire } from 'node:module';
import { rawTransferSupported } from 'oxc-parser';

interface NativeBinding {
  engineVersion: () => string;
  extractSpecifiers: (filePath: string, sourceText: string, rawComments?: boolean, wasiParser?: boolean) => string[];
  isAmbientDeclarationFile: (filePath: string, sourceText: string, wasiParser?: boolean) => boolean;
  liveContainingExports: (
    exports: Array<{ identifier: string; referencedIn: string[]; eligible: boolean; seed: boolean }>
  ) => boolean[];
}

const require = createRequire(import.meta.url);
const binding: NativeBinding = require('knip/native');
const parserBinding: { __napiBindingTarget?: string } = require('oxc-parser/src-js/bindings');
export const wasiParser = parserBinding.__napiBindingTarget === 'wasm32-wasi';
export const rawComments = process.env.KNIP_DISABLE_RAW_TRANSFER !== '1' && rawTransferSupported();

export const native = {
  ...binding,
  extractSpecifiers: (filePath: string, sourceText: string) =>
    binding.extractSpecifiers(filePath, sourceText, rawComments, wasiParser),
  isAmbientDeclarationFile: (filePath: string, sourceText: string) =>
    binding.isAmbientDeclarationFile(filePath, sourceText, wasiParser),
};
