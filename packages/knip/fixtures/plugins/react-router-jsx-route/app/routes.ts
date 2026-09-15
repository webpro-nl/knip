import { redirects } from './routes/permanent-redirect';

export default redirects.map(({ path }) => ({ path, file: 'routes/permanent-redirect.tsx' }));
