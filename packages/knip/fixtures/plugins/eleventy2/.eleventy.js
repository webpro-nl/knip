'use strict';

const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const path = require('path');
const highlighter = require('./src/_plugins/syntax-highlighter');

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData('site_name', 'example');
  eleventyConfig.addDataExtension('yml', () => {});
  eleventyConfig.addFilter('limitTo', () => {});
  eleventyConfig.addFilter('sortByPageOrder', () => {});
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(syntaxHighlight, {
    alwaysWrapLineHighlights: true,
    templateFormats: ['liquid', 'njk'],
  });
  eleventyConfig.setLibrary('md', () => {});
  eleventyConfig.addNunjucksShortcode('link', () => {});
  eleventyConfig.addShortcode('related_rules', () => {});
  eleventyConfig.addWatchTarget('./src/assets/');
  eleventyConfig.addPassthroughCopy({
    'src/_includes/abc.js': '/assets/abc.js',
  });
  eleventyConfig.addPassthroughCopy({
    './src/static': '/',
  });
  eleventyConfig.addPassthroughCopy('./src/assets/');
  eleventyConfig.addPassthroughCopy('src/static');
  eleventyConfig.addCollection('docs', () => {});
  eleventyConfig.addCollection('library', () => {});
  eleventyConfig.ignores.add('src/static/sitemap.njk');

  eleventyConfig.addPassthroughCopy({
    './node_modules/@org/lib/dist/build.js': '/assets/lib.js',
  });

  return {
    passthroughFileCopy: true,
    pathPrefix: '/docs/head/',
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: '_includes/layouts',
      data: '_data',
      output: '_site',
    },
  };
};
