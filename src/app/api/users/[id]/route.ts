import { handleDeleteUser, handleGetUser, handleUpdateUser } from '@/modules/users';

type RouteParams = { params: Promise<{ id: string }> };

async function withParams(handler: typeof handleGetUser, req: Request, { params }: RouteParams) {
  const { id } = await params;
  return handler(req, { params: { id } });
}

export async function GET(req: Request, ctx: RouteParams) {
  return withParams(handleGetUser, req, ctx);
}

export async function PUT(req: Request, ctx: RouteParams) {
  return withParams(handleUpdateUser, req, ctx);
}

export async function DELETE(req: Request, ctx: RouteParams) {
  return withParams(handleDeleteUser, req, ctx);
}
