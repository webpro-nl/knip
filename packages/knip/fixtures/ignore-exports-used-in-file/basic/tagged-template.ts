export function enchant(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.join('');
}

const spell = enchant`fire`;

spell;
