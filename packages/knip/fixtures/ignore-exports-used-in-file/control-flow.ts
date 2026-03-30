export const WARRIOR = 'warrior';
export const MAGE = 'mage';

function selectClass(role: string) {
  switch (role) {
    case WARRIOR:
      return 1;
    case MAGE:
      return 2;
  }
}

export const BASE_DAMAGE = 10;

function computeDamage(multiplier = BASE_DAMAGE) {
  return multiplier;
}

selectClass('warrior');
computeDamage();
