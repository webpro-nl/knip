/** @internal */
export interface ChartData {
  readonly series: readonly { label: string; color: string }[];
  readonly monthly: readonly (readonly [string, readonly number[]])[];
}

export function buildParams(data: ChartData): URLSearchParams {
  const params = new URLSearchParams();
  params.set('type', 'line');
  params.set('pivot', '1');
  params.set('lp', 'tr');
  params.set('br', '0');
  params.set('labelX', 'month');
  params.set('labelY', 'amount ($)');
  for (const { label, color } of data.series) {
    params.append('l', label);
    params.append('color', color);
  }
  for (const [month, values] of data.monthly) {
    params.append('label', month);
    params.append('data', values.join(','));
  }
  return params;
}
