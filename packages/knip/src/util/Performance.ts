import {
  type PerformanceEntry,
  PerformanceObserver,
  type RecordableHistogram,
  createHistogram,
  performance,
} from 'node:perf_hooks';
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
    duration: { type: 'boolean' },
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

interface MemoryEntry extends PerformanceEntry {
  detail: MemInfo;
}

const getMemInfo = (label: string): MemInfo => {
  const usage = memoryUsage();
  return { label, heapUsed: usage.heapUsed, heapTotal: usage.heapTotal, rss: usage.rss };
};

const twoFixed = (value: any) => (typeof value === 'number' ? value.toFixed(2) : value);
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

  private readonly startTime = performance.now();
  private readonly memId = `mem-${Math.floor(performance.now() * 100)}`;
  private readonly histograms = new Map<string, RecordableHistogram>();
  private readonly memEntries: MemoryEntry[] = [];
  private readonly memObserver?: PerformanceObserver;

  constructor({ isTimerifyFunctions = false, isMemoryUsageEnabled = false, isDurationEnabled = false }) {
    this.isEnabled = isTimerifyFunctions || isMemoryUsageEnabled;
    this.isTimerifyFunctions = isTimerifyFunctions;
    this.isMemoryUsageEnabled = isMemoryUsageEnabled;
    this.isDurationEnabled = isDurationEnabled;

    if (isMemoryUsageEnabled) {
      this.memObserver = new PerformanceObserver(items => {
        for (const entry of items.getEntries() as MemoryEntry[]) this.memEntries.push(entry);
      });
      this.memObserver.observe({ type: 'mark' });
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
    if (isMemoryRealtime) log(detail);
  }

  getTimerifiedFunctionsTable() {
    const totalDuration = this.getCurrentDurationInMs();
    const table = new Table({ header: true });
    for (const [name, h] of this.histograms) {
      if (h.count === 0) continue;
      const meanMs = h.mean / 1e6;
      const sumMs = meanMs * h.count;
      table.row();
      table.cell('Name', name);
      table.cell('size', h.count);
      table.cell('min', h.min / 1e6, twoFixed);
      table.cell('max', h.max / 1e6, twoFixed);
      table.cell('median', h.percentile(50) / 1e6, twoFixed);
      table.cell('sum', sumMs, twoFixed);
      table.cell('%', (sumMs / totalDuration) * 100, v => (typeof v === 'number' ? `${v.toFixed(0)}%` : ''));
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
      if (!entry.detail) continue;
      const { label, heapUsed, rss } = entry.detail;
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
    return performance.now() - this.startTime;
  }

  getMemHeapUsage() {
    return memoryUsage().heapUsed;
  }

  getCurrentMemUsageInMb() {
    return twoFixed(inMB(this.getMemHeapUsage()));
  }

  async finalize() {
    if (!this.isEnabled) return;
    this.addMemoryMark('end');
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  reset() {
    this.histograms.clear();
    this.memEntries.length = 0;
    this.memObserver?.disconnect();
  }
}

export const perfObserver = new Performance({ isTimerifyFunctions, isMemoryUsageEnabled, isDurationEnabled });

export const timerify = <T extends (...params: any[]) => any>(fn: T, name: string = fn.name): T => {
  if (!isTimerifyFunctions) return fn;
  if (timerifyOnlyFnName && !timerifyOnlyFnName.includes(name)) return fn;
  const histogram = perfObserver.registerHistogram(name);
  return performance.timerify(Object.defineProperty(fn, 'name', { value: name }), { histogram });
};
