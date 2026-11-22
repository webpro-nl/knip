// https://jasmine.github.io/setup/nodejs.html

export type JasmineConfig = {
  spec_dir?: string;
  spec_files?: string[];
  helpers?: string[];
  requires?: string[];
  loader?: string;
};
