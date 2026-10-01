/// <reference types="oh-my-types" />
/// <reference types="oh-my-preserved-types" preserve="true" />

const getEnvName = () => expect.getState().currentTestName ?? 'unknown';
