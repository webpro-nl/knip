// https://github.com/11ty/eleventy-base-blog/blob/main/eleventy.config.js
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    './public/': '/',
    './node_modules/prismjs/themes/prism-okaidia.css': '/css/prism-okaidia.css',
    './js/client/script.js': 'script.js',
  });
  eleventyConfig.addWatchTarget('content/**/*.{svg,webp,png,jpeg}');
  eleventyConfig.addPlugin();
  eleventyConfig.addPlugin();
  eleventyConfig.addPlugin();
  eleventyConfig.addPlugin(undefined, {
    preAttributes: { tabindex: 0 },
  });
  eleventyConfig.addPlugin();
  eleventyConfig.addPlugin();
  eleventyConfig.addPlugin();
  eleventyConfig.addFilter('readableDate', (dateObj, format, zone) => {});
  eleventyConfig.addFilter('htmlDateString', dateObj => {});
  eleventyConfig.addFilter('head', (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });
  eleventyConfig.addFilter('min', (...numbers) => {
    return Math.min.apply(null, numbers);
  });
  eleventyConfig.addFilter('getAllTags', collection => {
    let tagSet = new Set();
    for (let item of collection) {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    }
    return Array.from(tagSet);
  });
  eleventyConfig.addFilter('filterTagList', function filterTagList(tags) {
    return (tags || []).filter(tag => ['all', 'nav', 'post', 'posts'].indexOf(tag) === -1);
  });
  eleventyConfig.amendLibrary('md', mdLib => {
    eleventyConfig.getFilter('slugify');
  });
  return {
    templateFormats: ['md', 'njk', 'html', 'liquid'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'content',
      includes: '../_includes',
      data: '../_data',
      output: '_site',
    },
    pathPrefix: '/',
  };
};
