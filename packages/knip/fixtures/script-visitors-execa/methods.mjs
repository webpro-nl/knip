import { execa, execaSync, execaCommand, execaCommandSync, execaNode, $sync } from 'execa';

$sync`pnpm dlx executable4`;

await execa('bun x', ['executable5']);

execaSync('npx', ['executable6']);

await execaCommand('bunx executable7');

execaCommandSync('pnpx executable8');
