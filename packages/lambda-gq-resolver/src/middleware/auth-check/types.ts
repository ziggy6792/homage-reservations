/* eslint-disable no-await-in-loop */
import { ResolverData } from 'type-graphql';

import { IContext } from 'src/typegraphql-setup/context';

export type AuthCheck = (action: ResolverData<IContext>) => Promise<boolean>;
