import type { Role } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

export interface RouteContext {
  session?: SessionUser;
  params?: Record<string, string>;
  correlationId?: string;
}

export type Handler = (req: Request, ctx: RouteContext) => Response | Promise<Response>;

export type Middleware = (handler: Handler) => Handler;
