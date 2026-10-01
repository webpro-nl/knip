import { Command } from '@oclif/core';

export default class Migrate extends Command {
  async run() {
    this.log('migrate');
  }
}
