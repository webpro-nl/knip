export const truncate = (text: string, width: number) =>
  text.length > width ? `${text.slice(0, width - 3)}...` : text;

export const truncateStart = (text: string, width: number) =>
  text.length > width ? `...${text.slice(-(width - 3))}` : text;

export const pad = (value: string, width: number, fillString?: string, align?: 'left' | 'center' | 'right') =>
  align === 'right'
    ? value.padStart(width, fillString)
    : align === 'center'
      ? value.padStart((value.length + width) / 2, fillString).padEnd(width, fillString)
      : value.padEnd(width, fillString);
