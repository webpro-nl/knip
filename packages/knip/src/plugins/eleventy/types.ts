import type { DummyEleventyConfig } from './helpers.js';

export type EleventyConfig = {
  dir?: {
    input?: string;
    output?: string;
    includes?: string;
    layouts?: string;
    data?: string;
  };
  templateFormats?: string | string[];
};

export type EleventyConfigOrFn =
  | Partial<EleventyConfig>
  | ((arg: DummyEleventyConfig) => Promise<Partial<EleventyConfig>>);
