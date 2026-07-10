import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/index.ts';

const { reserveInventory } = proxyActivities<typeof activities>();

export async function fulfillOrder(orderId: string) {
  await reserveInventory(orderId);
}
