/// <reference path="./reference.d.ts" />
/// <reference types="reference-public" />

import type { PublicSignature } from 'public-signature';
import type { MisplacedPublic } from 'misplaced-public';
import type { MissingPublic } from 'missing-public';
import type { Legacy } from 'legacy';
import type { ManifestOnly } from 'manifest-only';

export type { ReexportedPublic } from 'reexported-public';
export type { TransitivePublic } from './nested.js';

export declare const inferred: import('inferred-public').InferredPublic;
export declare const virtualAsset: import('virtual-public:assets').Asset;
export type InlinePublic = import('inline-public').InlinePublic;
export declare function acceptsPublic(value: PublicSignature): void;
export declare function acceptsMisplaced(value: MisplacedPublic): void;
export declare function acceptsMissing(value: MissingPublic): void;
export declare function acceptsLegacy(value: Legacy): void;
export declare function acceptsManifestOnly(value: ManifestOnly): void;
