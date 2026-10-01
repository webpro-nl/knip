const ignorePatterns = [];

/** @type {import('some-types').Module} */
const obj = {};

/**
 * @returns {Promise<import('type-fest').PackageJson>}
 */
const getPackageManifest = async () => ({});

/** @type {string | null} */
const str = 'str';

function fn() {
  /** @type {import('more-types')} */
  const obj = {};
}

/** @import { SomeType } from "some-module" */

/**
 * @param {SomeType} myValue
 */
function doSomething1(myValue) {
  // ...
}

/** @import * as someModule from "some-other-module" */

/**
 * @param {someModule.SomeType} myValue
 */
function doSomething2(myValue) {
  // ...
}

/** @type {import('@jest/types')} */
module.exports = {};

/** @const {import('const-types').Setting} */
const setting = null;

/** @member {import('member-types').Field} */
const field = null;

// import('./should-not-resolve')
// See import('./also-should-not-resolve') for details

/**
 * Example usage:
 * const LazyComponent = lazy(() => import('./myComponent'))
 * <LazyLoad component={LazyComponent} />
 */
function lazyLoad() {}

/**
 * @example
 *   { index: true, lazy: lazyComponent(() => import('./Foo'), 'Foo') }
 */
export const lazyComponent = (loader, name) => ({ loader, name });
