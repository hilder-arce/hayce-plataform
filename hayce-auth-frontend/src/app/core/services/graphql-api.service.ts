import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { GRAPHQL_API_URL } from '../constants/api-routes.const';

interface GraphqlErrorItem {
  message: string;
  code?: string;
  details?: unknown;
}

interface GraphqlResponse<T> {
  data?: T;
  errors?: GraphqlErrorItem[];
}

@Injectable({ providedIn: 'root' })
export class GraphqlApiService {
  private readonly http = inject(HttpClient);

  query<TData>(
    query: string,
    variables?: Record<string, unknown>,
    context?: HttpContext,
  ): Observable<TData> {
    return this.execute<TData>(query, variables, context);
  }

  mutate<TData>(
    mutation: string,
    variables?: Record<string, unknown>,
    context?: HttpContext,
  ): Observable<TData> {
    return this.execute<TData>(mutation, variables, context);
  }

  private execute<TData>(
    query: string,
    variables?: Record<string, unknown>,
    context?: HttpContext,
  ): Observable<TData> {
    return this.http
      .post<GraphqlResponse<TData>>(
        GRAPHQL_API_URL,
        { query, variables },
        {
          withCredentials: true,
          context,
        },
      )
      .pipe(
        map((response) => {
          if (response.errors?.length) {
            throw this.toHttpError(response.errors[0]);
          }

          if (!response.data) {
            throw new HttpErrorResponse({
              status: 500,
              statusText: 'GraphQL Empty Response',
              error: { message: 'La API GraphQL no devolvió datos.' },
            });
          }

          return response.data;
        }),
        catchError((error) => throwError(() => error)),
      );
  }

  private toHttpError(error: GraphqlErrorItem): HttpErrorResponse {
    const status =
      error.code === 'UNAUTHENTICATED'
        ? 401
        : error.code === 'FORBIDDEN'
          ? 403
          : error.code === 'BAD_USER_INPUT'
            ? 400
            : 500;

    return new HttpErrorResponse({
      status,
      statusText: error.code ?? 'GRAPHQL_ERROR',
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    });
  }
}
