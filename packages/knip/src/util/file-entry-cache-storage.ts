import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { deserialize } from 'node:v8';
import type { CacheEnvelope, CacheSerializer } from './file-entry-cache.ts';

const magic = Buffer.from('KNIPJ001');
const headerSize = 68;
const emptyDigest = Buffer.alloc(32);
const maxFrames = 33;
const journalLimit = (size: number) => Math.min(16 * 1024 * 1024, Math.max(64 * 1024, size / 4));

const isEnvelope = <T>(value: unknown): value is CacheEnvelope<T> =>
  !!value &&
  typeof value === 'object' &&
  'version' in value &&
  value.version === 1 &&
  'context' in value &&
  typeof value.context === 'string' &&
  'entries' in value &&
  value.entries instanceof Map;

export class FileEntryCacheStorage<T> {
  private size = 0;
  private snapshotSize = 0;
  private frames = 0;
  private digest: Uint8Array = emptyDigest;

  read(filePath: string): unknown {
    const bytes = fs.readFileSync(filePath);
    if (!bytes.subarray(0, magic.length).equals(magic)) return deserialize(bytes);
    let offset = magic.length;
    let frames = 0;
    let snapshotSize = 0;
    let digest = emptyDigest;
    let envelope: CacheEnvelope<T> | undefined;
    while (offset < bytes.length) {
      if (offset + headerSize > bytes.length || ++frames > maxFrames) throw new Error('Invalid cache frame');
      const length = bytes.readUInt32LE(offset);
      const end = offset + headerSize + length;
      if (end > bytes.length || !bytes.subarray(offset + 4, offset + 36).equals(digest))
        throw new Error('Invalid cache frame');
      const payload = bytes.subarray(offset + headerSize, end);
      digest = createHash('sha256').update(digest).update(payload).digest();
      if (!bytes.subarray(offset + 36, offset + headerSize).equals(digest)) throw new Error('Invalid cache checksum');
      const value: unknown = deserialize(payload);
      if (!isEnvelope<T>(value)) throw new Error('Invalid cache envelope');
      if (!envelope) {
        envelope = value;
        snapshotSize = end;
      } else {
        if (
          value.context !== envelope.context ||
          !Array.isArray(value.removed) ||
          !value.removed.every(key => typeof key === 'string')
        )
          throw new Error('Invalid cache update');
        for (const key of value.removed) envelope.entries.delete(key);
        for (const [key, meta] of value.entries) envelope.entries.set(key, meta);
        if ('dependencies' in value) envelope.dependencies = value.dependencies;
      }
      offset = end;
    }
    if (!envelope || bytes.length - snapshotSize > journalLimit(snapshotSize)) throw new Error('Invalid cache journal');
    this.size = bytes.length;
    this.snapshotSize = snapshotSize;
    this.frames = frames;
    this.digest = digest;
    return envelope;
  }

  write(
    filePath: string,
    envelope: CacheEnvelope<T>,
    changed: Set<string>,
    removed: Set<string>,
    dependenciesChanged: boolean,
    replace: boolean,
    serialize: CacheSerializer<T>
  ) {
    try {
      if (
        !replace &&
        this.snapshotSize > 0 &&
        this.frames < maxFrames &&
        changed.size + removed.size <= envelope.entries.size / 4
      ) {
        const entries: CacheEnvelope<T>['entries'] = new Map();
        for (const key of changed) {
          const meta = envelope.entries.get(key);
          if (meta) entries.set(key, meta);
        }
        const update: CacheEnvelope<T> = {
          version: 1,
          context: envelope.context,
          entries,
          removed: [...removed],
        };
        if (dependenciesChanged) update.dependencies = envelope.dependencies;
        const frame = this.frame(serialize(update), this.digest);
        if (this.size + frame.length - this.snapshotSize <= journalLimit(this.snapshotSize)) {
          fs.appendFileSync(filePath, frame);
          this.size += frame.length;
          this.frames++;
          this.digest = Buffer.from(frame.subarray(36, headerSize));
          return;
        }
      }
      const frame = this.frame(serialize(envelope), emptyDigest);
      const temporary = `${filePath}.${randomUUID()}.tmp`;
      try {
        fs.writeFileSync(temporary, Buffer.concat([magic, frame]));
        fs.renameSync(temporary, filePath);
      } finally {
        fs.rmSync(temporary, { force: true });
      }
      this.size = this.snapshotSize = magic.length + frame.length;
      this.frames = 1;
      this.digest = Buffer.from(frame.subarray(36, headerSize));
    } catch (error) {
      this.snapshotSize = 0;
      throw error;
    }
  }

  private frame(payload: Uint8Array, previous: Uint8Array) {
    const frame = Buffer.allocUnsafe(headerSize + payload.length);
    frame.writeUInt32LE(payload.length);
    frame.set(previous, 4);
    frame.set(createHash('sha256').update(previous).update(payload).digest(), 36);
    frame.set(payload, headerSize);
    return frame;
  }
}
