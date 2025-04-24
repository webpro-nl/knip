import assert from 'node:assert/strict';
import type { Issue, Location } from 'codeclimate-types';

function assertAndRemoveProperty<TIn extends object, TProp extends keyof TIn>(
  obj: TIn,
  propName: TProp,
  assertProperty: (value: TIn[TProp]) => void
): Omit<TIn, TProp> {
  const { [propName]: value, ...rest } = obj;
  assertProperty(value);
  return rest;
}

export function assertAndRemoveFingerprint(issue: Issue) {
  return assertAndRemoveProperty(issue, 'fingerprint', fingerprint => assert.match(fingerprint, /[a-f0-9]{32}/));
}

const getBeginLine = (loc: Location): number =>
  'lines' in loc ? loc.lines.begin : 'line' in loc.positions.begin ? loc.positions.begin.line : 0;

export function orderByPos(a: Issue, b: Issue): number {
  const pathCompare = a.location.path.localeCompare(b.location.path);
  if (pathCompare !== 0) return pathCompare;
  return getBeginLine(a.location) - getBeginLine(b.location);
}
