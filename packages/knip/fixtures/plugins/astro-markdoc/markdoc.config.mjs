import { defineMarkdocConfig, component } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    heading: {
      render: component('./src/components/Heading.astro'),
    },
  },
  tags: {
    callout: {
      render: component('./src/components/Callout.astro', "CTA"),
    },
  },
});
