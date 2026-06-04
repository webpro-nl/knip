export const blade = { damage: 50 };

export const hilt = { grip: 'leather' };

const forged = blade as unknown;

const reinforced = hilt!;

forged;
reinforced;
