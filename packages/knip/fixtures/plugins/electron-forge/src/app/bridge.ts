import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('notes', {});
