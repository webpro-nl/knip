import Application from '@ember/application';
import { DEBUG } from '@glimmer/env';
import { Promise } from 'rsvp';
import config from 'dummy/config/environment';
export default class App extends Application {
  modulePrefix = config.modulePrefix;
  ready = DEBUG ? Promise.resolve() : undefined;
}
