import { layout } from '../lib/layout.js';

export const getStaticPaths = () => [{ params: { slug: 'apples' } }];

export default ({ params }: { params: { slug: string } }) => layout(`<h1>${params.slug}</h1>`);
