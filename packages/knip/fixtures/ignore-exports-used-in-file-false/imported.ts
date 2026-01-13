interface ReferencedInterfaceInternally {
  message: string;
}

function referencedInternallyFunction(value: unknown) {
  //
}

export function usedFunction(options: ReferencedInterfaceInternally) {
  referencedInternallyFunction(options);
}

function declaredThenExportedDefault() {}
export default declaredThenExportedDefault;

function DeclaredThenExportedNamed() {}
export { DeclaredThenExportedNamed };
