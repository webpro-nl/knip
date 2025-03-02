import { graphql } from '@octokit/graphql';

const START_DATE = new Date('2023-11-01');
const RATE_EUR_TO_USD = 1.08;
const RECURRING_ONLY = process.argv.includes('--recurring-only');

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

const getMonthlyTotals = async (token: string): Promise<Map<string, number>> => {
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

  for (let d = new Date(START_DATE); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    monthlyTotals.set(d.toISOString().substring(0, 7), 0);
  }

  for (const transaction of account.transactions.nodes) {
    if (RECURRING_ONLY && transaction.kind !== 'CONTRIBUTION') continue;

    const month = new Date(transaction.createdAt).toISOString().substring(0, 7);
    const amount = Math.round(transaction.amount.value);
    monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + amount);
  }

  if (!RECURRING_ONLY) {
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

const main = async () => {
  const token = process.env.OPENCOLLECTIVE_TOKEN;
  if (!token) throw new Error('OPENCOLLECTIVE_TOKEN is not set');
  const monthlyData = await getMonthlyTotals(token);

  let grandTotal = 0;
  for (const [month, amount] of [...monthlyData.entries()].sort()) {
    console.log(`${month} ${amount}`);
    grandTotal += amount;
  }

  console.log(`\nGrand total: ${grandTotal} (${monthlyData.size} months)`);
};

main().catch(console.error);
