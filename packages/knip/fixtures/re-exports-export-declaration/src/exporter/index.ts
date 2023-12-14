import * as exporterNS from './exporter';
import * as exporterFnNS from './exporter-fn';

exporterFnNS.cb2();

export { exporterNS as exporter, exporterFnNS as exporterFn };
