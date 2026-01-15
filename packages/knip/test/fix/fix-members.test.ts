import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/fix-members');

const readContents = async (fileName: string) => await readFile(join(cwd, fileName), 'utf8');

test('Fix enum members', async () => {
  const tests = [
    [
      'class.ts',
      await readContents('class.ts'),
      `export class Rectangle {
  constructor(
    public width: number,
    public height: number
  ) {}

` +
        '  \n\n  ' +
        `

  private set unusedSetter(w: number) {
    this.width = w;
  }

  area() {
    return this.width * this.height;
  }
}
`,
    ],
    [
      'enums.ts',
      await readContents('enums.ts'),
      `export enum Directions {
  East = 2,
  }

export enum Fruits {
  apple = 'apple',
  }
`,
    ],
  ];

  const options = await createOptions({ cwd, includedIssueTypes: ['classMembers'], isFix: true });
  const { issues } = await main(options);

  assert(issues.enumMembers['enums.ts']['Fruits.orange']);
  assert(issues.enumMembers['enums.ts']['Directions.North']);
  assert(issues.enumMembers['enums.ts']['Directions.South']);
  assert(issues.enumMembers['enums.ts']['Directions.West']);
  assert(issues.classMembers['class.ts']['Rectangle.Key']);
  assert(issues.classMembers['class.ts']['Rectangle.unusedGetter']);

  for (const [fileName, before, after] of tests) {
    const filePath = join(cwd, fileName);
    const originalFile = await readFile(filePath);
    assert.equal(String(originalFile), after);
    await writeFile(filePath, before);
  }
});
