export const pick = () => 'picked';

export type Pip = { size: number };

function measure(pip: Pip) {
  return pip.size;
}

measure({ size: 1 });
