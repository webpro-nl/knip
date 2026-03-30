'use strict';

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
