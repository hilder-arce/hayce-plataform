import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    if (context.getType<'graphql' | 'http'>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext().req?.user;
    }

    return context.switchToHttp().getRequest().user;
  },
);
