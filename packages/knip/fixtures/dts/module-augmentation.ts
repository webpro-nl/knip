interface AppTheme {
  color: string;
}

declare module '@org/ui' {
  export interface Theme extends AppTheme {}
}

export namespace Palette {
  export const red = '#f00';
  export const blue = '#00f';
}
