import type { PrivateSource } from 'private-source';

const privateState: PrivateSource | undefined = undefined;

export const hasPrivateState = () => privateState !== undefined;
