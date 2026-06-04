import type { Employee, UserInfo } from './utils.ts';

export const u: UserInfo = {
  name: 'John Doe',
  address: { street: '123 Main St', city: 'Anytown' },
  contact: { email: 'john@example.com' },
};

export const e: Employee = {
  email: 'jane@example.com',
  role: 'engineer',
};
