import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';

test('Fix enum and namespace members', async () => {
  const cwd = await copyFixture('fixtures/fix-members');
  const options = await createOptions({ cwd, isFix: true });
  const { issues } = await main(options);

  assert(issues.enumMembers['enums.ts']['Fruits.orange']);
  assert(issues.enumMembers['enums.ts']['Directions.North']);
  assert(issues.enumMembers['enums.ts']['Directions.South']);
  assert(issues.enumMembers['enums.ts']['Directions.West']);
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

  assert(issues.namespaceMembers['namespaces.ts']['Animals.unusedDog']);
  assert(issues.namespaceMembers['namespaces.ts']['Animals.Birds.unusedParrot']);
  assert(issues.namespaceMembers['namespaces.ts']['Shapes.length']);
  assert(issues.namespaceMembers['namespaces.ts']['Shapes.spin']);
  assert.equal(Object.keys(issues.namespaceMembers['namespaces.ts']).length, 4);
  assert.equal(
    await readFile(join(cwd, 'namespaces.ts'), 'utf8'),
    `export namespace Animals {
  export const cat = 'cat';
  export function swim() {}

  export namespace Birds {
    export const eagle = 'eagle';
    }
}

export namespace Shapes {
  export abstract class Base {}
  export class Circle extends Base {}

  export namespace Sizes {
    export type Size = number;
    export const small: Size = 1;
  }

  export const area = (size: Sizes.Size) => size;

  export interface Options {
    sides: number;
  }
  export const options: Options = { sides: 4 };

  export function scale(value: number): number;
  export function scale(value: number) {
    return value;
  }
  export const double = () => scale(2);

  export const perimeter = () => [1, 2].length;

  }
`
  );
});
