type Commands = { commands?: Command[] };

export type Command =
  | string
  | {
      runScript?: string | { file?: string };
      runFlow?: string | Commands;
      repeat?: Commands;
      retry?: Commands;
    };

type Header = { onFlowStart?: Command[]; onFlowComplete?: Command[] };

export type MaestroConfig = [Header, Command[]] | { flows?: string | string[] };
