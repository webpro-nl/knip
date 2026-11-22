import Ember from 'ember';
import RSVP from 'rsvp';
import Application from '@ember/application';
import config from 'orchard-classic/config/environment';
import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  version = [Ember.VERSION, RSVP.Promise];
}
