import { Banner } from './components/banner.tsx';

const components = { Banner } as const;

export function useMDXComponents(): typeof components {
  return components;
}
