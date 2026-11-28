export interface MoonConfiguration {
  tasks?: {
    [taskName: string]: {
      command?: string | string[];
      args?: string | string[];
      script?: string;
    };
  };
}
