export type File = string | { file?: string };

type Commands = { file?: string; commands?: Command[] };

export type Command =
  | string
  | {
      runScript?: File;
      runFlow?: string | Commands;
      repeat?: { commands?: Command[] };
      retry?: Commands;
    };

type Header = { onFlowStart?: Command[]; onFlowComplete?: Command[] };

export type MaestroConfig = [Header?, Command[]?];
