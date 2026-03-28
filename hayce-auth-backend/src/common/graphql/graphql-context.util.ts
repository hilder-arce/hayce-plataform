import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request, Response } from 'express';

export interface GraphqlRequestContext {
  req: Request;
  res: Response;
}

export function getRequestResponse(
  context: ExecutionContext,
): GraphqlRequestContext {
  const contextType = context.getType<'http' | 'graphql' | 'ws'>();

  if (contextType === 'graphql') {
    const gqlContext =
      GqlExecutionContext.create(context).getContext<GraphqlRequestContext>();
    return {
      req: gqlContext.req,
      res: gqlContext.res,
    };
  }

  return {
    req: context.switchToHttp().getRequest<Request>(),
    res: context.switchToHttp().getResponse<Response>(),
  };
}
