import os from 'node:os';
import { type PerformanceEntry, PerformanceObserver, performance } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
import parsedArgValues from './cli-arguments.js';
import { getStats } from './math.js';
import { Table } from './table.js';

const {
  performance: isPerformanceEnabled = false,
  memory: isMemoryEnabled = false,
  'memory-realtime': memoryRealtime = false,
} = parsedArgValues;

export const timerify = <T extends (...params: any[]) => any>(fn: T, name: string = fn.name): T => {
  if (!isPerformanceEnabled) return fn;
  return performance.timerify(Object.defineProperty(fn, 'name', { get: () => name }));
};

type MemInfo = {
  heapUsed: number;
  heapTotal: number;
  freemem: number;
};

interface MemoryEntry extends PerformanceEntry {
  detail: MemInfo;
}

const getMemInfo = (): MemInfo => Object.assign({ freemem: os.freemem() }, memoryUsage());

const twoFixed = (value: any) => (typeof value === 'number' ? value.toFixed(2) : value);

const inMB = (bytes: number) => bytes / 1024 / 1024;

const keys = ['heapUsed', 'heapTotal', 'freemem'] as const;
const logHead = () => console.log(keys.map(key => key.padStart(10)).join('  '));
const log = (memInfo: MemInfo) => console.log(keys.map(key => twoFixed(inMB(memInfo[key])).padStart(10)).join('  '));

class Performance {
  isEnabled: boolean;
  isPerformanceEnabled: boolean;
  isMemoryEnabled: boolean;
  startTime = 0;
  endTime = 0;
  perfEntries: PerformanceEntry[] = [];
  memEntries: MemoryEntry[] = [];
  perfId?: string;
  memId?: string;
  fnObserver?: PerformanceObserver;
  memObserver?: PerformanceObserver;
  memoryUsageStart?: ReturnType<typeof memoryUsage>;
  freeMemoryStart?: number;

  constructor({ isPerformanceEnabled = false, isMemoryEnabled = false }) {
    this.isEnabled = isPerformanceEnabled || isMemoryEnabled;
    this.isPerformanceEnabled = isPerformanceEnabled;
    this.isMemoryEnabled = isMemoryEnabled;

    this.startTime = performance.now();
    const instanceId = Math.floor(performance.now() * 100);
    this.perfId = `perf-${instanceId}`;
    this.memId = `mem-${instanceId}`;

    if (isPerformanceEnabled) {
      // timerified functions
      this.fnObserver = new PerformanceObserver(items => {
        for (const entry of items.getEntries()) {
          this.perfEntries.push(entry);
        }
      });
      this.fnObserver.observe({ type: 'function' });
    }

    if (isMemoryEnabled) {
      this.memObserver = new PerformanceObserver(items => {
        for (const entry of items.getEntries() as MemoryEntry[]) {
          this.memEntries.push(entry);
        }
      });
      this.memObserver.observe({ type: 'mark' });

      if (memoryRealtime) logHead();
      this.addMemoryMark(0);
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

  getPerformanceTable() {
    const entriesByName = this.getPerfEntriesByName();
    const table = new Table({ header: true });
    for (const [name, values] of Object.entries(entriesByName)) {
      const stats = getStats(values);
      table.newRow();
      table.cell('Name', name);
      table.cell('size', values.length);
      table.cell('min', stats.min, twoFixed);
      table.cell('max', stats.max, twoFixed);
      table.cell('median', stats.median, twoFixed);
      table.cell('sum', stats.sum, twoFixed);
    }
    table.sort('sum|desc');
    return table.toString();
  }

  addMemoryMark(index: number) {
    if (!this.isMemoryEnabled) return;
    const id = `${this.memId}:${index}`;
    const detail = getMemInfo();
    performance.mark(id, { detail });
    if (memoryRealtime && detail) log(detail);
  }

  getMemoryTable() {
    const table = new Table({ header: true });
    for (const entry of this.memEntries) {
      if (!entry.detail) continue;
      table.newRow();
      table.cell('heapUsed', inMB(entry.detail.heapUsed), twoFixed);
      table.cell('heapTotal', inMB(entry.detail.heapTotal), twoFixed);
      table.cell('freemem', inMB(entry.detail.freemem), twoFixed);
    }
    return table.toString();
  }

  getCurrentDurationInMs(startTime?: number) {
    return performance.now() - (startTime ?? this.startTime);
  }

  getMemHeapUsage() {
    return (memoryUsage().heapUsed ?? 0) - (this.memoryUsageStart?.heapUsed ?? 0);
  }

  getCurrentMemUsageInMb() {
    return twoFixed(inMB(this.getMemHeapUsage()));
  }

  public async finalize() {
    if (!this.isEnabled) return;
    // Workaround to get all entries
    await this.flush();
  }

  public reset() {
    this.perfEntries = [];
    this.fnObserver?.disconnect();
    this.memObserver?.disconnect();
  }
}

export const perfObserver = new Performance({ isPerformanceEnabled, isMemoryEnabled });
