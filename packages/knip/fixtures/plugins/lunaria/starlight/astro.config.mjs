import starlight from '@astrojs/starlight';
import lunaria from '@lunariajs/starlight';

export default {
  integrations: [
    starlight({
      plugins: [
        lunaria({
          configPath: './custom/translated.json',
        }),
      ],
    }),
  ],
};
