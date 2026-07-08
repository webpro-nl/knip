import { Command } from '@oclif/core';

export default class Hello extends Command {
  async run() {
    this.log('hello');
  }
}
