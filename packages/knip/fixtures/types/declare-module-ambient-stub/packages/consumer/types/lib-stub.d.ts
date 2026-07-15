declare module '@stub/lib' {
  export function greet(name: string): string;
  export function fetchGreeting(name: string): Promise<string>;
}
