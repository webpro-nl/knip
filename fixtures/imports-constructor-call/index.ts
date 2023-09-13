// import.meta.url: URL in browsers, file: protocol in Node.js etc.

// new URL('./exists.js');
new URL('https://example.org/url1.js');
new URL('file1.js', import.meta.url);
new URL('./file2.js', import.meta.url);
new URL('file3.js', 'https://example.org');
const baseUrl = 'https://example.org';
new URL('/', baseUrl);
new URL(baseUrl);

// TODO Implement?
new Worker('worker1.js');
new Worker(new URL('worker2.js', import.meta.url));
new Worker('./worker3.js');
