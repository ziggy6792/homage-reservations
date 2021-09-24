/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */

import pluralize from 'pluralize';
import { ResolverBuilder, ResolverType } from './resolver-builder';
import { IResolverBuilderProps } from './types';

export default class GetMany extends ResolverBuilder {
  public readonly props: IResolverBuilderProps;

  public type = ResolverType.GetMany;

  constructor(props?: IResolverBuilderProps) {
    super(props);
  }

  getResolverName(suffix: string): string {
    return `list${pluralize.plural(suffix)}`;
  }
}
