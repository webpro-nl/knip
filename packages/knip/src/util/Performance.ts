import { type RecordableHistogram, createHistogram, performance } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
import { parseArgs } from 'node:util';
import { Table } from './table.ts';

const { values } = parseArgs({
  strict: false,
  options: {
    performance: { type: 'boolean' },
    'performance-fn': { type: 'string', multiple: true },
    memory: { type: 'boolean' },
    'memory-realtime': { type: 'boolean' },
    duration: { type: 'boolean', short: 'u' },
  },
});

const timerifyOnlyFnName = values['performance-fn'];
const isMemoryRealtime = !!values['memory-realtime'];
const isTimerifyFunctions = !!values.performance || !!timerifyOnlyFnName;
const isMemoryUsageEnabled = !!values.memory || isMemoryRealtime;
const isDurationEnabled = !!values.duration;

type MemInfo = {
  label: string;
  heapUsed: number;
  heapTotal: number;
  rss: number;
};

const getMemInfo = (label: string): MemInfo => {
  const usage = memoryUsage();
  return { label, heapUsed: usage.heapUsed, heapTotal: usage.heapTotal, rss: usage.rss };
};

const twoFixed = (value: any) => (typeof value === 'number' ? value.toFixed(2) : value);
const formatDuration = (ms: unknown) =>
  typeof ms === 'number' ? (ms < 0.01 ? `${(ms * 1000).toFixed(2)}µs` : `${ms.toFixed(2)}ms`) : String(ms);
const inMB = (bytes: number) => bytes / 1024 / 1024;

const keys = ['heapUsed', 'heapTotal', 'rss'] as const;
// oxlint-disable-next-line no-console
const logHead = () => console.log(['phase', ...keys].map(key => key.padStart(10)).join('  '));
const log = (memInfo: MemInfo) =>
  // oxlint-disable-next-line no-console
  console.log([memInfo.label.padStart(10), ...keys.map(key => twoFixed(inMB(memInfo[key])).padStart(10))].join('  '));

class Performance {
  readonly isEnabled: boolean;
  readonly isTimerifyFunctions: boolean;
  readonly isMemoryUsageEnabled: boolean;
  readonly isDurationEnabled: boolean;

  private startTime = performance.now();
  private endTime: number | undefined;
  private readonly memId = `mem-${Math.floor(performance.now() * 100)}`;
  private readonly histograms = new Map<string, RecordableHistogram>();
  private readonly memEntries: MemInfo[] = [];

  constructor({ isTimerifyFunctions = false, isMemoryUsageEnabled = false, isDurationEnabled = false }) {
    this.isEnabled = isTimerifyFunctions || isMemoryUsageEnabled;
    this.isTimerifyFunctions = isTimerifyFunctions;
    this.isMemoryUsageEnabled = isMemoryUsageEnabled;
    this.isDurationEnabled = isDurationEnabled;

    if (isMemoryUsageEnabled) {
      if (isMemoryRealtime) logHead();
      this.addMemoryMark('start');
    }
  }

  registerHistogram(name: string): RecordableHistogram {
    let histogram = this.histograms.get(name);
    if (!histogram) {
      histogram = createHistogram();
      this.histograms.set(name, histogram);
    }
    return histogram;
  }

  addMemoryMark(label: string) {
    if (!this.isMemoryUsageEnabled) return;
    const detail = getMemInfo(label);
    performance.mark(`${this.memId}:${label}`, { detail });
    this.memEntries.push(detail);
    if (isMemoryRealtime) log(detail);
  }

  getSnapshot() {
    const processMs = this.getProcessDurationInMs();
    const functions = [];
    for (const [name, h] of this.histograms) {
      if (h.count === 0) continue;
      const meanMs = h.mean / 1e6;
      functions.push({
        name,
        count: h.count,
        minMs: h.min / 1e6,
        maxMs: h.max / 1e6,
        meanMs,
        medianMs: h.percentile(50) / 1e6,
        p95Ms: h.percentile(95) / 1e6,
        sumMs: meanMs * h.count,
      });
    }
    const memory = [];
    for (const entry of this.memEntries) memory.push({ ...entry });
    return { durationMs: processMs - this.startTime, processMs, functions, memory };
  }

  getTimerifiedFunctionsTable() {
    const { durationMs, functions } = this.getSnapshot();
    const table = new Table({ header: true });
    for (const entry of functions) {
      table.row();
      table.cell('Name', entry.name);
      table.cell('size', entry.count);
      table.cell('min', entry.minMs, formatDuration);
      table.cell('max', entry.maxMs, formatDuration);
      table.cell('median', entry.medianMs, formatDuration);
      table.cell('sum', entry.sumMs, formatDuration);
      table.cell('%', (entry.sumMs / durationMs) * 100, v => (typeof v === 'number' ? `${v.toFixed(0)}%` : ''));
    }
    table.sort('sum', 'desc');
    return table.toString();
  }

  getMemoryUsageTable() {
    const table = new Table({ header: true });
    let prevHeapUsed = 0;
    let peakHeapUsed = 0;
    let peakRss = 0;
    for (const entry of this.memEntries) {
      const { label, heapUsed, rss } = entry;
      const delta = heapUsed - prevHeapUsed;
      if (heapUsed > peakHeapUsed) peakHeapUsed = heapUsed;
      if (rss > peakRss) peakRss = rss;
      table.row();
      table.cell('Phase', label);
      table.cell('heapUsed', inMB(heapUsed), twoFixed);
      table.cell('rss', inMB(rss), twoFixed);
      table.cell('Δheap', prevHeapUsed === 0 ? '' : `${delta > 0 ? '+' : ''}${twoFixed(inMB(delta))}`, String);
      prevHeapUsed = heapUsed;
    }
    table.row();
    table.cell('Phase', 'peak');
    table.cell('heapUsed', inMB(peakHeapUsed), twoFixed);
    table.cell('rss', inMB(peakRss), twoFixed);
    table.cell('Δheap', '');
    return table.toString();
  }

  getCurrentDurationInMs() {
    return this.getProcessDurationInMs() - this.startTime;
  }

  getProcessDurationInMs() {
    return this.endTime ?? performance.now();
  }

  startRun() {
    this.startTime = performance.now();
    this.endTime = undefined;
  }

  getMemHeapUsage() {
    return memoryUsage().heapUsed;
  }

  getCurrentMemUsageInMb() {
    return twoFixed(inMB(this.getMemHeapUsage()));
  }

  finalize() {
    if (!this.isEnabled && !this.isDurationEnabled) return;
    this.endTime = performance.now();
    this.addMemoryMark('end');
  }

  reset() {
    for (const histogram of this.histograms.values()) histogram.reset();
    for (const entry of this.memEntries) performance.clearMarks(`${this.memId}:${entry.label}`);
    this.memEntries.length = 0;
    this.startRun();
  }
}

export const perfObserver = new Performance({ isTimerifyFunctions, isMemoryUsageEnabled, isDurationEnabled });

export const timerify = <T extends (...params: any[]) => any>(fn: T, name: string = fn.name): T => {
  if (!isTimerifyFunctions) return fn;
  if (timerifyOnlyFnName && !timerifyOnlyFnName.includes(name)) return fn;
  const histogram = perfObserver.registerHistogram(name);
  // Use Node.js v26.11.0+ if this throws ERR_OUT_OF_RANGE: https://github.com/nodejs/node/issues/41641
  return performance.timerify(Object.defineProperty(fn, 'name', { value: name }), { histogram });
};
