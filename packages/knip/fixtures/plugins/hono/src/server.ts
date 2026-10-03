import { Hono } from 'hono';
import { routes } from './routes.ts';

const app = new Hono();
app.route('/api', routes);

export default app;
