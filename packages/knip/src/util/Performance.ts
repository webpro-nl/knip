import { type PerformanceEntry, PerformanceObserver, performance } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
import { parseArgs } from 'node:util';
import { getStats } from './math.ts';
import { Table } from './table.ts';

const { values } = parseArgs({
  strict: false,
  options: {
    performance: { type: 'boolean' },
    'performance-fn': { type: 'string', multiple: true },
    memory: { type: 'boolean' },
    'memory-realtime': { type: 'boolean' },
  },
});

const timerifyOnlyFnName = values['performance-fn'];
const isMemoryRealtime = !!values['memory-realtime'];
const isTimerifyFunctions = !!values.performance || !!timerifyOnlyFnName;
const isMemoryUsageEnabled = !!values.memory || isMemoryRealtime;

export const timerify = <T extends (...params: any[]) => any>(fn: T, name: string = fn.name): T => {
  if (!isTimerifyFunctions) return fn;
  if (timerifyOnlyFnName && !timerifyOnlyFnName.includes(name)) return fn;
  return performance.timerify(Object.defineProperty(fn, 'name', { get: () => name }));
};

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
  isEnabled: boolean;
  isTimerifyFunctions: boolean;
  isMemoryUsageEnabled: boolean;
  startTime = 0;
  endTime = 0;
  perfEntries: PerformanceEntry[] = [];
  memEntries: MemoryEntry[] = [];
  perfId?: string;
  memId?: string;
  fnObserver?: PerformanceObserver;
  memObserver?: PerformanceObserver;

  constructor({ isTimerifyFunctions = false, isMemoryUsageEnabled = false }) {
    this.isEnabled = isTimerifyFunctions || isMemoryUsageEnabled;
    this.isTimerifyFunctions = isTimerifyFunctions;
    this.isMemoryUsageEnabled = isMemoryUsageEnabled;

    this.startTime = performance.now();
    const instanceId = Math.floor(performance.now() * 100);
    this.perfId = `perf-${instanceId}`;
    this.memId = `mem-${instanceId}`;

    if (isTimerifyFunctions) {
      this.fnObserver = new PerformanceObserver(items => {
        for (const entry of items.getEntries()) {
          this.perfEntries.push(entry);
        }
      });
      this.fnObserver.observe({ type: 'function' });
    }

    if (isMemoryUsageEnabled) {
      this.memObserver = new PerformanceObserver(items => {
        for (const entry of items.getEntries() as MemoryEntry[]) {
          this.memEntries.push(entry);
        }
      });
      this.memObserver.observe({ type: 'mark' });

      if (isMemoryRealtime) logHead();
      this.addMemoryMark('start');
    }
  }

  private setMark(name: string) {
    const id = `${this.perfId}:${name}`;
    performance.mark(`${id}:start`);
  }

  private clearMark(name: string) {
    const id = `${this.perfId}:${name}`;
    performance.mark(`${id}:end`);
    performance.measure(id, `${id}:start`, `${id}:end`);
    performance.clearMarks(`${id}:start`);
    performance.clearMarks(`${id}:end`);
  }

  private async flush() {
    this.setMark('_flush');
    await new Promise(resolve => setTimeout(resolve, 1));
    this.clearMark('_flush');
  }

  private getPerfEntriesByName() {
    return this.perfEntries.reduce(
      (entries, entry) => {
        const name = entry.name.replace(`${this.perfId}:`, '');
        entries[name] = entries[name] ?? [];
        entries[name].push(entry.duration);
        return entries;
      },
      {} as Record<string, number[]>
    );
  }

  getTimerifiedFunctionsTable() {
    const entriesByName = this.getPerfEntriesByName();
    const totalDuration = this.getCurrentDurationInMs();
    const table = new Table({ header: true });
    for (const [name, values] of Object.entries(entriesByName)) {
      const stats = getStats(values);
      table.row();
      table.cell('Name', name);
      table.cell('size', values.length);
      table.cell('min', stats.min, twoFixed);
      table.cell('max', stats.max, twoFixed);
      table.cell('median', stats.median, twoFixed);
      table.cell('sum', stats.sum, twoFixed);
      table.cell('%', (stats.sum / totalDuration) * 100, v => (typeof v === 'number' ? `${v.toFixed(0)}%` : ''));
    }
    table.sort('sum|desc');
    return table.toString();
  }

  addMemoryMark(label: string) {
    if (!this.isMemoryUsageEnabled) return;
    const id = `${this.memId}:${label}`;
    const detail = getMemInfo(label);
    performance.mark(id, { detail });
    if (isMemoryRealtime) log(detail);
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

  public async finalize() {
    if (!this.isEnabled) return;
    this.addMemoryMark('end');
    await this.flush();
  }

  public reset() {
    this.perfEntries = [];
    this.fnObserver?.disconnect();
    this.memObserver?.disconnect();
  }
}

export const perfObserver = new Performance({ isTimerifyFunctions, isMemoryUsageEnabled });
