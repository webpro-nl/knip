import { initialize } from '@fixtures/telemetry/client';
import { provide } from '@fixtures/providers';
import '../adapters/unused-export.ts';

export default function Page() {
  initialize();
  provide();
}
