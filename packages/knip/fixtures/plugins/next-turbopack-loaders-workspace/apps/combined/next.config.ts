import getWebConfig, { getAdminNextConfig } from '@workspace/next-config';

export default { ...getWebConfig(), ...getAdminNextConfig() };
