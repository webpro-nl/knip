export type EleventyConfig = {
  dir: {
    input: string;
    output: string;
    includes: string;
    layouts: string;
    data: string;
  };
  templateFormats: string | string[];
};
