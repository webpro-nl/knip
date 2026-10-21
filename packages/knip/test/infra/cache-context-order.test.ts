import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { ConfigurationChief } from '../../src/ConfigurationChief.ts';
import { ProjectPrincipal } from '../../src/ProjectPrincipal.ts';
import type { GetImportsAndExportsOptions } from '../../src/types/config.ts';
import { join } from '../../src/util/path.ts';
import { clearResolverCache } from '../../src/util/resolve.ts';
import { createOptions } from '../helpers/create-options.ts';

const analysis: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: false,
  isFixTypes: false,
  isReportExports: true,
  tags: [[], []],
};

const fields: ('configFiles' | 'projects' | 'entries' | 'programs')[] = [
  'configFiles',
  'projects',
  'entries',
  'programs',
];

for (const field of fields) {
  test(`Analysis cache ignores ${field} insertion order but rejects changed membership`, async t => {
    const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-cache-context-order-')));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    writeFileSync(join(cwd, 'package.json'), '{}');
    const cacheLocation = join(cwd, '.cache');
    const options = await createOptions({
      cwd,
      args: { cache: true, 'cache-location': cacheLocation },
      isSession: true,
    });
    const chief = new ConfigurationChief(options);
    await chief.getWorkspaces();
    const entries = [join(cwd, 'z-entry.ts'), join(cwd, 'a-entry.ts')];
    const programs = [join(cwd, 'z-program.ts'), join(cwd, 'a-program.ts')];
    const alternate = join(cwd, 'alternate.ts');
    const paths = {
      configFiles: [join(cwd, 'z.config.ts'), join(cwd, 'a.config.ts')],
      projects: [join(cwd, 'z-unused.ts'), join(cwd, 'a-unused.ts'), ...entries, ...programs, alternate],
      entries,
      programs,
    };
    const replacement = field === 'projects' ? join(cwd, 'other-unused.ts') : alternate;
    for (const members of Object.values(paths)) {
      for (const path of members) writeFileSync(path, 'export const fruit = "apple";');
    }
    writeFileSync(replacement, 'export const fruit = "apple";');

    const analyze = async (warm: boolean) => {
      clearResolverCache(true);
      const principal = new ProjectPrincipal(
        options,
        path => path,
        undefined,
        () => '.'
      );
      for (const path of paths.projects) principal.addProjectPath(path);
      principal.addEntryPaths(paths.entries);
      for (const path of paths.programs) principal.addProgramPath(path);
      principal.initNative(chief, false, analysis, paths.configFiles);
      assert.deepEqual([...principal.projectPaths], paths.projects);
      assert.deepEqual([...principal.entryPaths], paths.entries);
      assert.deepEqual([...principal.programPaths], paths.programs);
      const visited: string[] = [];
      const hits: boolean[] = [];
      const exports: string[][] = [];
      await principal.walkAndAnalyze((path, _parsed, source, cached) => {
        visited.push(path);
        hits.push(!!cached);
        const file = principal.analyzeSourceFile(path, source, analysis, false, undefined, cached);
        exports.push([...file.exports.keys()]);
        return undefined;
      }, analysis);
      const expected = [...paths.entries, ...paths.programs];
      assert.deepEqual(visited, expected);
      assert.deepEqual(
        hits,
        expected.map(() => warm)
      );
      assert.deepEqual(
        exports,
        expected.map(() => ['fruit'])
      );
      assert.deepEqual(
        principal.getUnreferencedFiles(),
        paths.projects.filter(path => !expected.includes(path))
      );
      principal.reconcileCache(new Map());
    };

    await analyze(false);
    await analyze(true);
    const cacheFiles = readdirSync(cacheLocation);
    assert.equal(cacheFiles.length, 1);
    const cachePath = join(cacheLocation, cacheFiles[0]);
    const contents = readFileSync(cachePath);
    const modified = statSync(cachePath).mtimeMs;
    paths[field].reverse();
    await analyze(true);
    assert.deepEqual(readdirSync(cacheLocation), cacheFiles);
    assert.deepEqual(readFileSync(cachePath), contents);
    assert.equal(statSync(cachePath).mtimeMs, modified);
    paths[field][0] = replacement;
    await analyze(false);
  });
}
