import type { NextConfig } from 'next';
import { getAdminNextConfig as getConfig } from '@workspace/next-config';

export default getConfig() satisfies NextConfig;
