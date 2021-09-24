/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */

import pluralize from 'pluralize';
import { ArgOptions } from 'type-graphql';
import { ResolverBuilder, ResolverType } from './resolver-builder';
import { IResolverBuilderProps } from './types';

interface IUpdateManyResolverBuilderProps extends IResolverBuilderProps {
  argOptions?: ArgOptions;
  inputType: any;
}

export default class UpdateMany extends ResolverBuilder {
  public readonly props: IUpdateManyResolverBuilderProps;

  public readonly type = ResolverType.UpdateMany;

  constructor(props?: IUpdateManyResolverBuilderProps) {
    super(props);
  }

  getResolverName(suffix: string): string {
    return `update${pluralize.plural(suffix)}`;
  }
}
