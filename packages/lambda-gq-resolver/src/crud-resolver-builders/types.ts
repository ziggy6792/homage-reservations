import { AdvancedOptions } from 'type-graphql/dist/decorators/types';
import { Middleware } from 'type-graphql/dist/interfaces/Middleware';

export interface IResolverBuilderProps {
  middleware?: Middleware<any>[];
  resolverOptions?: AdvancedOptions;
}
