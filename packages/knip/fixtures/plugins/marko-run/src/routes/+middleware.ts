import { trackVisit } from '../services/analytics.ts';

export default (_context: unknown, next: () => Response) => {
  trackVisit();
  return next();
};
