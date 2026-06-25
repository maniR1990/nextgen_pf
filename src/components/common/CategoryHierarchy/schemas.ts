import { CATEGORY_FLOW_TYPE_SLUGS } from '@/constants/categories';
import {
  getHierarchyMeta,
} from '@/constants/category-hierarchy';
import {
  ACCOUNT_SIDE_TYPES,
  HIERARCHY_CRUD_MODES,
  HIERARCHY_DENSITIES,
  HIERARCHY_DEFAULT_VARIANT,
  HIERARCHY_VARIANTS,
} from '@/constants/settings';
import { z } from 'zod';

const categoryFlowTypeSlugSchema = z.enum(
  CATEGORY_FLOW_TYPE_SLUGS as unknown as [string, ...string[]],
);

const accountSideTypeSchema = z.enum(
  ACCOUNT_SIDE_TYPES as unknown as [string, ...string[]],
);

const categoryHierarchyLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export type CategoryHierarchyNodeJson = {
  id: string;
  name: string;
  level: 0 | 1 | 2;
  type?: string;
  emoji?: string;
  icon?: string;
  color?: string;
  monthlyBudget?: number;
  monthlySpend?: number;
  readOnly?: boolean;
  children?: CategoryHierarchyNodeJson[];
};

export const CategoryHierarchyNodeSchema: z.ZodType<CategoryHierarchyNodeJson> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    level: categoryHierarchyLevelSchema,
    type: z.string().min(1).optional(),
    emoji: z.string().max(4).optional(),
    icon: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    monthlyBudget: z.number().nonnegative().optional(),
    monthlySpend: z.number().nonnegative().optional(),
    readOnly: z.boolean().optional(),
    children: z.array(CategoryHierarchyNodeSchema).optional(),
  }),
);

function validateHierarchyNodes(
  nodes: CategoryHierarchyNodeJson[],
  variant: (typeof HIERARCHY_VARIANTS)[number],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[] = ['nodes'],
) {
  const meta = getHierarchyMeta(variant);
  const rootTypeSchema =
    variant === 'account' ? accountSideTypeSchema : categoryFlowTypeSlugSchema;

  for (const [index, node] of nodes.entries()) {
    const nodePath = [...pathPrefix, index];

    if (node.level === 0 && !node.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Level 0 nodes require a type',
        path: [...nodePath, 'type'],
      });
    }

    if (node.level === 0 && node.type) {
      const parsed = rootTypeSchema.safeParse(node.type);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid root type for ${variant} hierarchy`,
          path: [...nodePath, 'type'],
        });
      }
    }

    if (node.level > meta.maxLevel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Level cannot exceed ${meta.maxLevel}`,
        path: [...nodePath, 'level'],
      });
    }

    if (node.children?.some((child) => child.level !== node.level + 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Child level must be exactly one greater than parent level',
        path: [...nodePath, 'children'],
      });
    }

    if (node.children?.length) {
      validateHierarchyNodes(node.children, variant, ctx, [...nodePath, 'children']);
    }
  }
}

export const CategoryHierarchyConfigSchema = z
  .object({
    variant: z.enum(HIERARCHY_VARIANTS).default(HIERARCHY_DEFAULT_VARIANT),
    density: z.enum(HIERARCHY_DENSITIES).default('comfortable'),
    crudMode: z.enum(HIERARCHY_CRUD_MODES).default('menu'),
    showHeader: z.boolean().default(true),
    showBudget: z.boolean().default(false),
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    ariaLabel: z.string().min(1).optional(),
    defaultExpandedIds: z.array(z.string().min(1)).optional(),
    nodes: z.array(CategoryHierarchyNodeSchema).default([]),
  })
  .superRefine((config, ctx) => {
    validateHierarchyNodes(config.nodes, config.variant, ctx);
  })
  .transform((config) => {
    const meta = getHierarchyMeta(config.variant);
    return {
      ...config,
      ariaLabel: config.ariaLabel ?? meta.defaultAriaLabel,
    };
  });

export type CategoryHierarchyConfigJson = z.infer<typeof CategoryHierarchyConfigSchema>;
