import { handleDeleteBudgetLine, handleUpdateBudgetLine } from '@/modules/budget';

type RouteParams = { params: Promise<{ id: string }> };

async function withParams(
  handler: typeof handleUpdateBudgetLine,
  req: Request,
  { params }: RouteParams,
) {
  const { id } = await params;
  return handler(req, { params: { id } });
}

export async function PATCH(req: Request, ctx: RouteParams) {
  return withParams(handleUpdateBudgetLine, req, ctx);
}

export async function DELETE(req: Request, ctx: RouteParams) {
  return withParams(handleDeleteBudgetLine, req, ctx);
}
