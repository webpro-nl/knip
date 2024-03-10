import { performance, PerformanceObserver, PerformanceEntry } from 'node:perf_hooks';
import { constants } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
import EasyTable from 'easy-table';
import prettyMilliseconds from 'pretty-ms';
import Summary from 'summary';
import parsedArgValues from './cli-arguments.js';
import { debugLog } from './debug.js';

const { performance: isEnabled = false } = parsedArgValues;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const timerify = <T extends (...params: any[]) => any>(fn: T, name: string = fn.name): T => {
  if (!isEnabled) return fn;
  return performance.timerify(Object.defineProperty(fn, 'name', { get: () => name }));
};

export class Performance {
  isEnabled: boolean;
  startTime = 0;
  endTime = 0;
  entries: PerformanceEntry[] = [];
  instanceId?: number;
  fnObserver?: PerformanceObserver;
  gcObserver?: PerformanceObserver;
  memoryUsageStart?: ReturnType<typeof memoryUsage>;
  memoryUsageEnd?: ReturnType<typeof memoryUsage>;

  constructor(isEnabled: boolean) {
    if (isEnabled) {
      this.startTime = performance.now();
      this.instanceId = Math.floor(performance.now() * 100);

      // timerified functions
      this.fnObserver = new PerformanceObserver(items => {
        items.getEntries().forEach(entry => {
          this.entries.push(entry);
        });
      });
      this.fnObserver.observe({ entryTypes: ['function'] });

      // major garbage collection events
      this.gcObserver = new PerformanceObserver(items => {
        for (const item of items.getEntries()) {
          if ((item.detail as { kind: number })?.kind === constants.NODE_PERFORMANCE_GC_MAJOR) {
            debugLog('*', `GC (after ${prettyMilliseconds(item.startTime)} in ${prettyMilliseconds(item.duration)})`);
          }
        }
      });
      this.gcObserver.observe({ entryTypes: ['gc'] });

      this.memoryUsageStart = memoryUsage();
    }
    this.isEnabled = isEnabled;
  }

  private setMark(name: string) {
    const id = `${this.instanceId}:${name}`;
    performance.mark(`${id}:start`);
  }

  private clearMark(name: string) {
    const id = `${this.instanceId}:${name}`;
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

  private getEntriesByName() {
    return this.entries.reduce(
      (entries, entry) => {
        const name = entry.name.replace(`${this.instanceId}:`, '');
        entries[name] = entries[name] ?? [];
        entries[name].push(entry.duration);
        return entries;
      },
      {} as Record<string, number[]>
    );
  }

  getTable() {
    const entriesByName = this.getEntriesByName();
    const table = new EasyTable();
    Object.entries(entriesByName).forEach(([name, values]) => {
      const stats = new Summary(values);
      table.cell('Name', name);
      table.cell('size', stats.size(), EasyTable.number(0));
      table.cell('min', stats.min(), EasyTable.number(2));
      table.cell('max', stats.max(), EasyTable.number(2));
      table.cell('median', stats.median(), EasyTable.number(2));
      table.cell('sum', stats.sum(), EasyTable.number(2));
      table.newRow();
    });
    table.sort(['sum|des']);
    return table.toString().trim();
  }

  getTotalTime() {
    return this.endTime - this.startTime;
  }

  getMemHeapUsage() {
    return (this.memoryUsageEnd?.heapUsed ?? 0) - (this.memoryUsageStart?.heapUsed ?? 0);
  }

  public async finalize() {
    if (!this.isEnabled) return;
    this.endTime = performance.now();
    this.memoryUsageEnd = memoryUsage();
    // Workaround to get all entries
    await this.flush();
  }

  public reset() {
    this.entries = [];
    this.fnObserver?.disconnect();
  }
}
