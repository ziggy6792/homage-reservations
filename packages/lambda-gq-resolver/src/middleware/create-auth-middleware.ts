/* eslint-disable no-await-in-loop */
import { MiddlewareFn, ResolverData } from 'type-graphql';
import errorMessage from 'src/config/error-message';
import { IContext } from 'src/typegraphql-setup/context';
import { AuthCheck } from './auth-check/types';
import isAuthRole from './auth-check/is-auth-role';

const defaultAuthChecks = [isAuthRole];

const checkAuth = async (authChecks: AuthCheck[], action: ResolverData<IContext>): Promise<boolean> => {
  const errors = [];
  for (let i = 0; i < authChecks.length; i++) {
    try {
      const result = await authChecks[i](action);
      if (result) {
        return true;
      }
    } catch (err) {
      errors.push(err);
      console.log('auth check returned error', err);
    }
  }
  if (errors.length > 0) {
    throw new Error(`Authentication Errors: ${errors.map((err) => err.message).join('\n')}`);
  }

  return false;
};

// Does an or on all auth checks returns false if no auth checks pass
const createAuthMiddleware = (authChecks: AuthCheck[] = []): MiddlewareFn<IContext> => {
  const mergedAuthChecks = [...defaultAuthChecks, ...authChecks];
  const retMiddleware: MiddlewareFn<IContext> = async (action, next) => {
    const isAuthorized = await checkAuth(mergedAuthChecks, action);
    if (!isAuthorized) {
      throw new Error(errorMessage.auth.notAuthenticated);
    }
    return next();
  };
  return retMiddleware;
};

export default createAuthMiddleware;
