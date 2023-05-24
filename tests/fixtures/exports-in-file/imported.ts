export interface NeverReferenced {
  hello: boolean;
}

export interface ReferencedInterfaceInternally {
  message: string;
  repeat?: number;
}

export function referencedFunctionInternally(value: unknown) {
  console.log(value);
}

export function usedFunction(options: ReferencedInterfaceInternally) {
  referencedFunctionInternally(options);
}
