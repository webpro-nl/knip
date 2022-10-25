import { performance, PerformanceObserver, PerformanceEntry } from 'node:perf_hooks';
import Summary from 'summary';
import EasyTable from 'easy-table';
import parsedArgs from './parseArgs.js';
import type { TimerifyOptions } from 'node:perf_hooks';

type Timerify = <T extends (...params: any[]) => any>(fn: T, options?: TimerifyOptions) => T;

const { values } = parsedArgs;
const { performance: isEnabled = false } = values;

// Naming convention: _wrapped() functions are prefixed with an underscore
export const timerify: Timerify = fn => (isEnabled ? performance.timerify(fn) : fn);

class Performance {
  enabled: boolean;
  entries: PerformanceEntry[] = [];
  instanceId?: number;
  observer?: PerformanceObserver;

  constructor(enabled: boolean) {
    if (enabled) {
      this.instanceId = Math.floor(performance.now() * 100);
      this.observer = new PerformanceObserver(items => {
        items.getEntries().forEach(entry => {
          this.entries.push(entry);
        });
      });
      this.observer.observe({ entryTypes: ['measure', 'function'] });
    }
    this.enabled = enabled;
  }

  start(name: string) {
    if (!this.enabled) return;
    const id = `${this.instanceId}:${name}`;
    performance.mark(`${id}:start`);
  }

  end(name: string) {
    if (!this.enabled) return;
    const id = `${this.instanceId}:${name}`;
    performance.mark(`${id}:end`);
    performance.measure(id, `${id}:start`, `${id}:end`);
    performance.clearMarks(`${id}:start`);
    performance.clearMarks(`${id}:end`);
  }

  getEntriesByName() {
    return this.entries.reduce((entries, entry) => {
      const name = entry.name.replace(`${this.instanceId}:`, '');
      entries[name] = entries[name] ?? [];
      entries[name].push(entry.duration);
      return entries;
    }, {} as Record<string, number[]>);
  }

  getTable(sort = ['sum|des']) {
    const entriesByName = this.getEntriesByName();
    const table = new EasyTable();
    Object.entries(entriesByName).map(([name, values]) => {
      const stats = new Summary(values);
      table.cell('Name', name);
      table.cell('size', stats.size(), EasyTable.number(0));
      table.cell('min', stats.min(), EasyTable.number(2));
      table.cell('max', stats.max(), EasyTable.number(2));
      table.cell('median', stats.median(), EasyTable.number(2));
      table.cell('sum', stats.sum(), EasyTable.number(2));
      table.newRow();
    });
    table.total('sum', { printer: EasyTable.number(2) });
    table.sort(sort);
    return table;
  }

  async flush() {
    this.start('_flush');
    await new Promise(resolve => setTimeout(resolve, 1));
    this.end('_flush');
  }

  async print() {
    if (!this.enabled) return;
    await this.flush();
    console.log('\n' + this.getTable().toString().trim());
  }

  reset() {
    this.entries = [];
    this.observer?.disconnect();
  }
}

export const measure = new Performance(isEnabled);
