const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('notes', {});
