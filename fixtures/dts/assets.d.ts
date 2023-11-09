/// <reference path="./index.d.ts" />

declare module '*.svg';

declare module '*.html?raw' {
  const value: string;
  export default value;
}
