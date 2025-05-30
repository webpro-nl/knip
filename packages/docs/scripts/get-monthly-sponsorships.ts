import { Table } from '../../knip/src/util/table.ts';
import { getGitHubTotals } from './get-monthly-sponsorships-github.ts';
import { getOpenCollectiveTotals } from './get-monthly-sponsorships-opencollective.ts';

const START_DATE = new Date('2023-11-01');
const END_DATE = new Date();
END_DATE.setDate(1);
END_DATE.setHours(-1);

const main = async () => {
  const [monthlyGHS, monthlyGHSRO, monthlyOC, monthlyOCRO] = await Promise.all([
    getGitHubTotals({ startDate: START_DATE, endDate: END_DATE, recurringOnly: false }),
    getGitHubTotals({ startDate: START_DATE, endDate: END_DATE, recurringOnly: true }),
    getOpenCollectiveTotals({ startDate: START_DATE, endDate: END_DATE, recurringOnly: false }),
    getOpenCollectiveTotals({ startDate: START_DATE, endDate: END_DATE, recurringOnly: true }),
  ]);

  const monthly = new Map<string, number[]>();
  for (const [month, amount] of monthlyGHS) monthly.set(month, [...(monthly.get(month) || []), amount]);
  for (const [month, amount] of monthlyOC) monthly.set(month, [...(monthly.get(month) || []), amount]);

  const monthlyRO = new Map<string, number[]>();
  for (const [month, amount] of monthlyGHSRO) monthlyRO.set(month, [...(monthlyRO.get(month) || []), amount]);
  for (const [month, amount] of monthlyOCRO) monthlyRO.set(month, [...(monthlyRO.get(month) || []), amount]);

  const table = new Table();
  const digits = (n: number) => (v: any) => (typeof v === 'number' ? v.toFixed(n) : v);
  const sum = Array.from(monthly.values()).reduce((a, c) => a + c.reduce((a, b) => a + b, 0), 0);
  const sumGHS = Array.from(monthlyGHS.values()).reduce((a, c) => a + c, 0);
  const sumOC = Array.from(monthlyOC.values()).reduce((a, c) => a + c, 0);
  const sumRO = Array.from(monthlyRO.values()).reduce((a, c) => a + c.reduce((a, b) => a + b, 0), 0);
  for (const [key, value] of [
    ['months', monthly.size],
    ['github', sumGHS],
    ['OC', sumOC],
    ['sum', sum],
    ['avg', sum / monthly.size],
    ['recurring sum', sumRO],
    ['recurring avg', sumRO / monthlyRO.size],
  ]) {
    table.row();
    table.cell('key', key);
    table.cell('value', value, digits(0));
  }

  console.log(table.toString());

  const url = new URL('/', 'https://try.venz.dev');
  url.searchParams.set('type', 'pivot');
  url.searchParams.set('lp', 'tr');
  url.searchParams.set('br', '0');
  url.searchParams.set('labelX', 'month');
  url.searchParams.set('labelY', 'amount ($)');
  url.searchParams.append('l', 'GitHub Sponsors');
  url.searchParams.append('color', '#fbfbfb');
  url.searchParams.append('l', 'Open Collective');
  url.searchParams.append('color', '#2487ff');
  for (const [month, amount] of monthly) {
    url.searchParams.append('label', month);
    url.searchParams.append('data', amount.join(','));
  }

  console.log('\nVenz link');
  const text = `${url.origin}?${decodeURIComponent(url.searchParams.toString()).replaceAll('#', '%23')}`;
  console.log(text);
};

main().catch(console.error);
