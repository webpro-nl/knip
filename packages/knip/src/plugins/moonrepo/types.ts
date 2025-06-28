export interface MoonConfiguration {
  tasks?: {
    [taskName: string]: {
      command: string;
    };
  };
}
