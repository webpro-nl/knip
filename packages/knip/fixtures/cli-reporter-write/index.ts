import type { Reporter } from '../../src/types.ts';

const reporter: Reporter = ({ write }) => write?.('hi from write reporter');

export default reporter;
