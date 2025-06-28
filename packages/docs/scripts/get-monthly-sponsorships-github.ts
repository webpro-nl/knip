import { graphql } from '@octokit/graphql';

const token = process.env.GITHUB_TOKEN;

type Options = {
  token?: string;
  startDate: Date;
  endDate?: Date;
  recurringOnly: boolean;
};

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

const getMonthlyTotals = async (options: Options) => {
  const { token, startDate, recurringOnly } = options;

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

  for (let d = new Date(startDate); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    monthlyTotals.set(d.toISOString().substring(0, 7), 0);
  }

  for (const activity of activities) {
    const { action, sponsor, sponsorsTier, timestamp } = activity;
    if (recurringOnly && sponsorsTier?.isOneTime) continue;
    const amount = sponsorsTier?.monthlyPriceInDollars || 0;
    const monthYear = new Date(timestamp).toISOString().substring(0, 7);

    if (sponsorsTier?.isOneTime) {
      if (!recurringOnly && action === 'NEW_SPONSORSHIP') {
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

export const getGitHubTotals = async (options: Options) => {
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  const monthlyData = await getMonthlyTotals({ ...options, token });
  const startMonth = options.startDate.toISOString().substring(0, 7);
  const endMonth = options.endDate?.toISOString().substring(0, 7);
  for (const month of monthlyData.keys()) {
    if (month < startMonth || (endMonth && month > endMonth)) monthlyData.delete(month);
  }
  return monthlyData;
};
