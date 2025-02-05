import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { parseWxml, parseWxs, parseWxss } from '../../../src/plugins/miniprogram/parser.js';

test('parseWxml should parse dependencies correctly', () => {
  const wxml = `
    <wxs src="/utils/format.wxs" module="format" />
    <wxs src="./helper.wxs" module="helper" />
    
    <import src="/templates/list" />
    <import src="./item.wxml" />
    
    <include src="/templates/header" />
    
    <view class="container">
      <image src="/images/logo.png" />
      <image src="./icon.png" />
    </view>
  `;

  const result = parseWxml(wxml, 'test.wxml');
  const expected = [
    "import '/images/logo.png'",
    "import './icon.png'",
    "import '/templates/list'",
    "import './item.wxml'",
    "import '/templates/header'",
    "import '/utils/format.wxs'",
    "import './helper.wxs'",
  ].join('\n');

  assert.equal(result, expected);
});

test('parseWxml should handle empty or invalid input', () => {
  assert.equal(parseWxml('', 'test.wxml'), '');
  assert.equal(parseWxml('<invalid>', 'test.wxml'), '');
});

test('parseWxss should parse dependencies correctly', () => {
  const wxss = `
    @import "/styles/theme.wxss";
    @import "./local.wxss";
    @import "@styles/alias.wxss";
    @import "~/styles/root.wxss";
    
    .container {
      padding: 20px;
    }
  `;

  const result = parseWxss(wxss, 'test.wxss');
  const expected = [
    "@import '/styles/theme.wxss'",
    "@import './local.wxss'",
    "@import '@styles/alias.wxss'",
    "@import '~/styles/root.wxss'",
  ].join('\n');

  assert.equal(result, expected);
});

test('parseWxss should handle empty or invalid input', () => {
  assert.equal(parseWxss('', 'test.wxss'), '');
  assert.equal(parseWxss('.invalid {', 'test.wxss'), '');
});

test('parseWxs should parse dependencies correctly', () => {
  const wxs = `
    var common = require('/utils/common.wxs');
    var helper = require('./helper.wxs');
    var format = require('@utils/format.wxs');
    var util = require('~/utils/util.wxs');
    
    module.exports = {
      format: common.format
    };
  `;

  const result = parseWxs(wxs, 'test.wxs');
  const expected = [
    "import '/utils/common.wxs'",
    "import './helper.wxs'",
    "import '@utils/format.wxs'",
    "import '~/utils/util.wxs'",
  ].join('\n');

  assert.equal(result, expected);
});

test('parseWxs should handle empty or invalid input', () => {
  assert.equal(parseWxs('', 'test.wxs'), '');
  assert.equal(parseWxs('invalid javascript', 'test.wxs'), '');
});
