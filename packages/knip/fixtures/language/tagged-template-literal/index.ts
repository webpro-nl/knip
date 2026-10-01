import 'astro';
import dedent from 'dedent';
import './app.ts';
import './index.astro';
import './Component.astro';
import './ScriptTag.astro';

const dedented = dedent`
  import Button from './Button'
  import type { FC } from 'react'
`;

dedented;
