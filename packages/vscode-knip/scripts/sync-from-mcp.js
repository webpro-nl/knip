#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DOC_TOOL_DESCRIPTION,
  DOC_TOOL_TOPIC_DESCRIPTION,
  RUN_KNIP_TOOL_DESCRIPTION,
} from '../../mcp-server/src/texts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '../package.json');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

pkg.contributes.languageModelTools[0].modelDescription = RUN_KNIP_TOOL_DESCRIPTION;
pkg.contributes.languageModelTools[1].modelDescription = DOC_TOOL_DESCRIPTION;
pkg.contributes.languageModelTools[1].inputSchema.properties.topic.description = DOC_TOOL_TOPIC_DESCRIPTION;

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// biome-ignore lint/suspicious/noConsole: yolo
console.log('Synced content to vscode-knip/package.json');
