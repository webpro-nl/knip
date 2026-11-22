import assert from 'node:assert/strict';
import test from 'node:test';
import { scriptBodies } from '../../src/compilers/compilers.ts';

test('Custom elements named script-* are not script blocks', () => {
  const source = `<template>
  <script-list :node-id="id"></script-list>
  <script-log :node-id="id" />
</template>

<script setup lang="ts">
import ScriptList from './ScriptList.vue';
</script>`;

  assert.equal(scriptBodies(source, 'Panel.vue'), "\nimport ScriptList from './ScriptList.vue';\n");
});

test('Script blocks are still extracted', () => {
  const source = `<SCRIPT>a</SCRIPT>
<script
  setup>b</script>
<script type="application/json" set:html={data} />
<script generic="T extends Record<string, unknown>">c</script>
<script>d</script>`;

  assert.equal(scriptBodies(source, 'Panel.vue'), 'a;\nb;\nc;\nd');
});
