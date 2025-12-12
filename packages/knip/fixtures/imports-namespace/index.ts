export * as ReExported from './re-exported-module';
import * as NS from './namespace';
import * as NS2 from './namespace2';
import * as NS3 from './namespace3';
import * as NS3_OPAQUE from './namespace3-opaque';
import * as NS4 from './namespace4';
import * as NS5 from './namespace5';
import * as NS5_OPAQUE from './namespace5-opaque';
import * as NS6 from './namespace6';
import * as NS6_OPAQUE from './namespace6-opaque';
import * as NS7 from './namespace7';
import * as NS8 from './namespace8';
import * as NS9 from './namespace9';
import * as NS10 from './namespace10';
import fn from 'external';

NS.identifier15;
NS['identifier16'];
NS.identifier17();

const { identifier18, identifier19, identifier20 } = NS2;

NS2.identifier21.method();

function usage() {
  const hello = { NS3 };
  hello.NS3.identifier31;
  const goodbye = { NS3_OPAQUE };
}

fn(NS4);

const spread = { ...NS5 };
spread.identifier35;

const butter = { ...NS5_OPAQUE };

const assign = NS6;
assign.identifier37;

const allot = NS6_OPAQUE;

fn([NS7]);

fn({ NS8 });

const func = () => {
  const cond = fn() ? NS9 : { identifier43: 43 };
  cond.identifier43;
};

const props: { values?: { identifier45: number; identifier46: number } } = {};
const { values = NS10 } = props;
values.identifier45
