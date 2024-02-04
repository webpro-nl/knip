export * as ReExported from './re-exported-module';
import * as NS from './namespace';
import * as NS2 from './namespace2';
import * as NS3 from './namespace3';
import * as NS4 from './namespace4';
import * as NS5 from './namespace5';
import * as NS6 from './namespace6';
import fn from 'external';

NS.identifier15;
NS['identifier16'];
NS.identifier17();

const { identifier18, identifier19, identifier20 } = NS2;

NS2.identifier21.method();

function usage() {
  const hello = { NS3 };
}

fn(NS4);

const spread = { ...NS5 };

const assign = NS6;
