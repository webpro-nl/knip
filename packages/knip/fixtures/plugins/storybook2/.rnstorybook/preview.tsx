import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds';
import { Preview } from '@storybook/react';

const preview: Preview = {
  decorators: [withBackgrounds],
};

export default preview;
