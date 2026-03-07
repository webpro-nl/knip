import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Fix enum members', async () => {
  const cwd = await copyFixture('fixtures/fix-members');
  const options = await createOptions({ cwd, includedIssueTypes: ['classMembers'], isFix: true });
  const { issues } = await main(options);

  assert(issues.enumMembers['enums.ts']['Fruits.orange']);
  assert(issues.enumMembers['enums.ts']['Directions.North']);
  assert(issues.enumMembers['enums.ts']['Directions.South']);
  assert(issues.enumMembers['enums.ts']['Directions.West']);
  assert(issues.classMembers['class.ts']['Rectangle.Key']);
  assert(issues.classMembers['class.ts']['Rectangle.unusedGetter']);

  assert.equal(
    await readFile(join(cwd, 'class.ts'), 'utf8'),
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
`
  );

  assert.equal(
    await readFile(join(cwd, 'enums.ts'), 'utf8'),
    `export enum Directions {
  East = 2,
  }

export enum Fruits {
  apple = 'apple',
  }
`
  );
});
