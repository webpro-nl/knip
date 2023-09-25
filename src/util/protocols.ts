export const toBinary = (specifier: string) => specifier.replace(/^(bin:)?/, 'bin:');

export const fromBinary = (specifier: string) => specifier.replace(/^(bin:)?/, '');

export const isBinary = (specifier: string) => specifier.startsWith('bin:');

export const toEntryPattern = (specifier: string) => specifier.replace(/^(e:)?/, 'e:');

export const fromEntryPattern = (specifier: string) => specifier.replace(/^(e:)?/, '');

export const isEntryPattern = (specifier: string) => specifier.startsWith('e:');

export const toProductionEntryPattern = (specifier: string) => specifier.replace(/^(p:)?/, 'p:');

export const fromProductionEntryPattern = (specifier: string) => specifier.replace(/^(p:)?/, '');

export const isProductionEntryPattern = (specifier: string) => specifier.startsWith('p:');
