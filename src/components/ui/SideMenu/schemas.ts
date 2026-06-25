import { SIDE_MENU_ICON_VALUES } from '@/constants/sideMenu';
import { z } from 'zod';

export const SideMenuBrandSchema = z.object({
  appName: z.string().min(1).max(40),
  logoIcon: z.enum(SIDE_MENU_ICON_VALUES as [string, ...string[]]).default('indian-rupee'),
  homeHref: z.string().min(1),
});

export const SideMenuItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(40),
  icon: z.enum(SIDE_MENU_ICON_VALUES as [string, ...string[]]),
  href: z.string().min(1),
  disabled: z.boolean().optional(),
});

export const SideMenuFooterSchema = z.object({
  periodLabel: z.string().min(1).max(40),
  surplusAmountMinor: z.number().int(),
  surplusCurrency: z.string().default('INR'),
  surplusSuffix: z.string().default('surplus'),
});

export const SideMenuConfigSchema = z.object({
  brand: SideMenuBrandSchema,
  items: z.array(SideMenuItemSchema).min(1),
  footer: SideMenuFooterSchema.optional(),
});

export type SideMenuBrandJson = z.infer<typeof SideMenuBrandSchema>;
export type SideMenuItemJson = z.infer<typeof SideMenuItemSchema>;
export type SideMenuFooterJson = z.infer<typeof SideMenuFooterSchema>;
export type SideMenuConfigJson = z.infer<typeof SideMenuConfigSchema>;
