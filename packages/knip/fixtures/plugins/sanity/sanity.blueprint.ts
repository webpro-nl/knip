import { defineBlueprint, defineDocumentFunction } from '@sanity/blueprints';

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'on-publish',
      event: { type: 'document.publish' },
    }),
  ],
});
