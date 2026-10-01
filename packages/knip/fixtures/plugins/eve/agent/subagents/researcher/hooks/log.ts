import { defineHook } from 'eve/hooks';
import { hookLogger } from 'hook-logger';

export default defineHook({
  onEvent: event => hookLogger(event),
});
