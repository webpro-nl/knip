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

export const prettyMilliseconds = (ms: number): string => {
  const seconds = ms / 1000;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${Math.floor(seconds % 60)}s`;
  if (minutes > 0) return `${minutes}m ${Math.floor(seconds % 60)}s`;
  return seconds % 1 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds)}s`;
};
