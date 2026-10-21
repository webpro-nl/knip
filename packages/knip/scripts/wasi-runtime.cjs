const runtime = require('@napi-rs/wasm-runtime');
const { createContext } = require('@emnapi/runtime');

function preserveUtf16({ emnapiString }) {
  emnapiString.utf16Decoder = {
    decode(bytes) {
      const units = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      let value = '';
      for (let offset = 0; offset < units.length; offset += 4096) {
        value += String.fromCharCode(...units.subarray(offset, offset + 4096));
      }
      return value;
    },
  };
  return {};
}

module.exports = {
  ...runtime,
  createContext,
  instantiateNapiModuleSync(input, options) {
    return runtime.instantiateNapiModuleSync(input, {
      ...options,
      plugins: [...(options.plugins ?? []), preserveUtf16],
    });
  },
};
