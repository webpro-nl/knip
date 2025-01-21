export const truncate = (text: string, width: number) =>
  text.length > width ? `${text.slice(0, width - 3)}...` : text;
