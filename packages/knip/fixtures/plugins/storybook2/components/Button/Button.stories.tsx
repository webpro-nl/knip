import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { MyButton } from './Button';

const meta = {
  component: MyButton,
} satisfies Meta<typeof MyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    text: 'Hello World',
    color: 'purple',
    onPress: fn(),
  },
};
