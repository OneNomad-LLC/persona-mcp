import type { StorageAdapter } from './adapter.js';
export type { StorageAdapter, SessionSummary, SoulName, JournalName } from './adapter.js';
export { CloudStorageAdapter } from './cloud-adapter.js';
export { FileStorageAdapter } from './file-adapter.js';
export { PostgresStorageAdapter } from './postgres-adapter.js';
export declare function createStorage(): Promise<StorageAdapter>;
export declare function setStorage(adapter: StorageAdapter): void;
export declare function getStorage(): StorageAdapter;
