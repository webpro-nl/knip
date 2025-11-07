// biome-ignore lint: suspicious/noRedundantUseStrict
'use strict';

// biome-ignore lint: complexity/useArrowFunction
module.exports = async function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('./src/assets/');
  eleventyConfig.addBundle('css', { hoist: true });
};

module.exports.config = {
  dir: {
    input: 'src',
    data: '_siteData',
  },
};
