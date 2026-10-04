import { DurableObject } from 'cloudflare:workers';
import { connect } from 'cloudflare:sockets';
import { env } from 'cloudflare:test';
import Cloudflare from 'cloudflare';

DurableObject;
connect;
env;
Cloudflare;
