import { NS } from './2-psuedo-re-exporter';

const x: NS.EnumA.InternalUsedProp = 1;

export function exportedFnOnNs() {
  NS.fnA();
}
