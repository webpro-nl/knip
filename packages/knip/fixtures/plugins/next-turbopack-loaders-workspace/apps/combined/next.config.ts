import type { NextConfig } from 'next';
import getWebConfig, { getAdminNextConfig } from '@workspace/next-config';

export default { ...getWebConfig(), ...getAdminNextConfig() } satisfies NextConfig;
