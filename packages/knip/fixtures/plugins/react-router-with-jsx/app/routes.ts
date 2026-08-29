import { redirects } from './routes/permanent-redirect';

export default redirects.map(({ path }) => ({ id: path, file: './routes/permanent-redirect.tsx' }));
