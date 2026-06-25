import { chromaticBaseline } from '@/components/ui/storyLayout';
import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'UI/Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
  },
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};
