export interface ReferencedNeverInterface {
  hello: boolean;
}

export interface ReferencedInterfaceInternally {
  message: string;
  repeat?: number;
}

export function referencedInternallyFunction(value: unknown) {
  //
}

export function usedFunction(options: ReferencedInterfaceInternally) {
  referencedInternallyFunction(options);
}

export function referencedNeverFunction() {
  //
}

function declaredThenExportedDefault() {}
export default declaredThenExportedDefault;

function DeclaredThenExportedNamed() {}
export { DeclaredThenExportedNamed };

export const scout = () => {};
export const ranger = () => {};

export class Paladin {
  static ally = scout;
}

(0, ranger)();
