import 'astro';
import dedent from 'dedent';
import './app.ts';

const dedented = dedent`
  import Button from './Button'
  import type { FC } from 'react'
`;

dedented;
