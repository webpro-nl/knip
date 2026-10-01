import { deferRoute, router } from './framework.js';
import { theme } from './pages/settings.js';

const Dashboard = deferRoute(() => import('./pages/dashboard.js'));

const Profile = deferRoute(async () => await import('./pages/profile.js'));

const Settings = router.lazy(() => import('./pages/settings.js'));

const Terms = deferRoute(() => import('./pages/terms.js').then(m => ({ default: m.TermsPanel })));

const commands = deferRoute(() => import('./pages/commands.js'));

console.log(theme, Dashboard, Profile, Settings, Terms, commands);
