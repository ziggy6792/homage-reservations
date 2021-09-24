import Context from 'src/typegraphql-setup/context';
import { Token } from 'typedi';

export const TEST_CONTEXT = new Token<Context>('TEST_CONTEXT');
