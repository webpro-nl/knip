import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', () => {});
