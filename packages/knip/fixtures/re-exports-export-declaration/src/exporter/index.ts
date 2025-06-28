import * as exporterA from './exporterA';
import * as exporterB from './exporterB';
import * as exporterC from './exporterC';
import * as exporterD from './exporterD';

exporterB.fn();

export { exporterA as reExporterA, exporterB as reExporterB, exporterC };
export { exporterD };
