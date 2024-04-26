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
