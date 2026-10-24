import { defineComponent } from 'vue';
import { shout } from './shout.ts';

export default defineComponent({
  data: () => ({ message: shout('hello') }),
});
