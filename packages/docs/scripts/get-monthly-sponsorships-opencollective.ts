import { graphql } from '@octokit/graphql';

const token = process.env.OPENCOLLECTIVE_TOKEN;
const RATE_EUR_TO_USD = 1.08;

type Options = {
  token?: string;
  startDate: Date;
  endDate?: Date;
  recurringOnly: boolean;
};

interface Transaction {
  id: string;
  type: string;
  kind: string;
  amount: {
    value: number;
    currency: string;
  };
  createdAt: string;
  fromAccount: {
    name: string;
  };
}

interface Expense {
  id: string;
  amount: number;
  currency: string;
  createdAt: string;
  type: string;
  status: string;
}

interface GraphQLResponse {
  account: {
    transactions: {
      nodes: Transaction[];
    };
  };
  expenses: {
    nodes: Expense[];
  };
}

const getMonthlyTotals = async (options: Options): Promise<Map<string, number>> => {
  const { token, startDate, recurringOnly } = options;

  const { account, expenses } = await graphql<GraphQLResponse>({
    query: `
      query {
        account(slug: "knip") {
          transactions(type: CREDIT) {
            nodes {
              id
              type
              kind
              amount {
                value
                currency
              }
              createdAt
              fromAccount {
                name
              }
            }
          }
        }
        expenses(fromAccount: { slug: "webpro" }) {
          nodes {
            id
            amount
            currency
            createdAt
            type
            status
          }
        }
      }
    `,
    url: 'https://api.opencollective.com/graphql/v2',
    headers: {
      'Api-Key': token,
      Accept: 'application/json',
    },
  });

  const monthlyTotals = new Map<string, number>();
  const now = new Date();

  for (let d = new Date(startDate); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    monthlyTotals.set(d.toISOString().substring(0, 7), 0);
  }

  for (const transaction of account.transactions.nodes) {
    if (recurringOnly && transaction.kind !== 'CONTRIBUTION') continue;

    const month = new Date(transaction.createdAt).toISOString().substring(0, 7);
    const amount = Math.round(transaction.amount.value);
    monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + amount);
  }

  if (!recurringOnly) {
    for (const expense of expenses.nodes) {
      const month = new Date(expense.createdAt).toISOString().substring(0, 7);
      const amount =
        expense.currency === 'EUR'
          ? Math.round((expense.amount / 100) * RATE_EUR_TO_USD)
          : Math.round(expense.amount / 100);
      monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + amount);
    }
  }

  return monthlyTotals;
};

export const getOpenCollectiveTotals = async (options: Options) => {
  if (!token) throw new Error('OPENCOLLECTIVE_TOKEN is not set');
  const monthlyData = await getMonthlyTotals({ ...options, token });
  const startMonth = options.startDate.toISOString().substring(0, 7);
  const endMonth = options.endDate?.toISOString().substring(0, 7);
  for (const month of monthlyData.keys()) {
    if (month < startMonth || (endMonth && month > endMonth)) monthlyData.delete(month);
  }
  return monthlyData;
};
