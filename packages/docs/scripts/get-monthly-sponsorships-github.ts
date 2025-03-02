import { graphql } from '@octokit/graphql';

const START_DATE = new Date('2023-11-01');
const RECURRING_ONLY = process.argv.includes('--recurring-only');

interface SponsorActivity {
  action: 'NEW_SPONSORSHIP' | 'CANCELLED_SPONSORSHIP';
  timestamp: string;
  sponsorsTier: {
    monthlyPriceInDollars: number;
    isOneTime: boolean;
  };
  sponsor: {
    login: string;
  };
}

interface GraphQLResponse {
  viewer: {
    sponsorsActivities: {
      nodes: SponsorActivity[];
    };
  };
}

const getMonthlyTotals = async (token: string) => {
  const { viewer } = await graphql<GraphQLResponse>({
    query: `
      query {
        viewer {
          sponsorsActivities(first: 100, period: ALL) {
            nodes {
              action
              timestamp
              sponsorsTier {
                monthlyPriceInDollars
                isOneTime
              }
              sponsor {
                ... on User { login }
                ... on Organization { login }
              }
            }
          }
        }
      }
    `,
    headers: {
      authorization: `token ${token}`,
    },
  });

  const activities = [...viewer.sponsorsActivities.nodes].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const activeRecurring = new Map<string, number>();
  const monthlyTotals = new Map<string, number>();
  const now = new Date();

  for (let d = new Date(START_DATE); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    monthlyTotals.set(d.toISOString().substring(0, 7), 0);
  }

  for (const activity of activities) {
    const { action, sponsor, sponsorsTier, timestamp } = activity;
    if (RECURRING_ONLY && sponsorsTier?.isOneTime) continue;
    const amount = sponsorsTier?.monthlyPriceInDollars || 0;
    const monthYear = new Date(timestamp).toISOString().substring(0, 7);

    if (sponsorsTier?.isOneTime) {
      if (!RECURRING_ONLY && action === 'NEW_SPONSORSHIP') {
        monthlyTotals.set(monthYear, (monthlyTotals.get(monthYear) || 0) + amount);
      }
    } else {
      if (action === 'NEW_SPONSORSHIP') activeRecurring.set(sponsor.login, amount);
      if (action === 'CANCELLED_SPONSORSHIP') activeRecurring.delete(sponsor.login);
      const total = Array.from(activeRecurring.values()).reduce((sum, a) => sum + a, 0);
      for (const month of monthlyTotals.keys()) {
        if (month >= monthYear) monthlyTotals.set(month, total);
      }
    }
  }

  return monthlyTotals;
};

const main = async () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set');
  }
  const monthlyData = await getMonthlyTotals(token);

  let grandTotal = 0;
  const startMonth = START_DATE.toISOString().substring(0, 7);
  const data = [...monthlyData.entries()].filter(([month]) => month >= startMonth);

  for (const [month, amount] of data.sort()) {
    console.log(`${month} ${amount}`);
    grandTotal += amount;
  }

  console.log(`\nGrand total: ${grandTotal} (${data.length} months)`);
};

main().catch(console.error);
