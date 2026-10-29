import type { Reporter } from '../../src/types.ts';

const reporter: Reporter = ({ write }) => write('hi from summary reporter');

export default reporter;
