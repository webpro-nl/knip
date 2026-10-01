declare module './events.js' {
  export interface EventBusEvents {
    'entity:archived': ArchiveMeta & { at: number };
  }
}

const source = import.meta.url;

console.info(source);
