import * as NS from './my-module.js';
import local = require('./local.js');
import external = require('external');
import something = NS.something;
local;
external;
something;
