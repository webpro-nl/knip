import type { Reporter } from '../../src/types.ts';

const reporter: Reporter = ({ write }) => write?.('hi from ts reporter');

export default reporter;
