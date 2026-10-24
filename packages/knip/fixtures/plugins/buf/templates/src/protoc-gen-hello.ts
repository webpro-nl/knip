import { createEcmaScriptPlugin, runNodeJs } from '@bufbuild/protoplugin';

runNodeJs(createEcmaScriptPlugin({ name: 'protoc-gen-hello', version: 'v1', generateTs() {} }));
