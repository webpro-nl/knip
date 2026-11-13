import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';
import config from 'orchard-app/config/environment';
export default class App extends Application {
  modulePrefix = config.modulePrefix;
  modules = compatModules;
}
