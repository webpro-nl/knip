// biome-ignore lint/suspicious/noRedundantUseStrict:  fixture festa
'use strict';

// biome-ignore lint/complexity/useArrowFunction:  fixture festa
module.exports = async function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('./src/assets/');
};

module.exports.config = {
  dir: {
    input: 'src',
    data: '_siteData',
  },
};
