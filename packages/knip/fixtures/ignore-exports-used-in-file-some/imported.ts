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
