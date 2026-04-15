// Case 1: type as function parameter (function imported)
export interface ParamConfig {
  host: string;
  port: number;
}
export function connect(config: ParamConfig): void {
  void config;
}

// Case 2: type as function return (function imported)
export interface ResponseData {
  items: string[];
  total: number;
}
export function fetchData(): ResponseData {
  return { items: [], total: 0 };
}

// Case 3: type in function body only (function imported)
export interface InternalState {
  ready: boolean;
}
export function initialize(): void {
  const state: InternalState = { ready: true };
  void state;
}

// Case 4: enum as function parameter (function imported)
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
}
export function setLogLevel(level: LogLevel): void {
  void level;
}

// Case 5: class as function return (function imported)
export class Connection {
  url = '';
}
export function createConnection(): Connection {
  return new Connection();
}

// Case 6: value used via typeof in function parameter (function imported)
export function defaultHandler(): void {}
export function setHandler(fn: typeof defaultHandler): void {
  void fn;
}

// Case 7: type in union type alias (union imported)
export interface SuccessResult {
  ok: true;
  data: string;
}
export interface ErrorResult {
  ok: false;
  error: string;
}
export type QueryResult = SuccessResult | ErrorResult;

// Case 8: interface extends another (derived imported)
export interface BaseEntity {
  id: string;
  createdAt: number;
}
export interface UserEntity extends BaseEntity {
  name: string;
}

// Case 9: type in interface property (interface imported)
export interface Metadata {
  version: number;
}
export interface Document {
  meta: Metadata;
  content: string;
}

// Case 10: type → type alias → function param (chain)
export interface FilterRule {
  field: string;
  operator: string;
}
export type FilterSet = FilterRule[];
export function applyFilters(filters: FilterSet): void {
  void filters;
}

// Case 11: type directly imported
export interface DirectlyUsed {
  value: number;
}

// Case 12: type completely unused
export interface CompletelyUnused {
  stale: boolean;
}

// Case 13: type in function param AND in type alias, only function imported
export interface SharedConfig {
  timeout: number;
}
export type AppConfig = { shared: SharedConfig };
export function configure(config: SharedConfig): void {
  void config;
}
