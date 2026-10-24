import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('bridge', {});
