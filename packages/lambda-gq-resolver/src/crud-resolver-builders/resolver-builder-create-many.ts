/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */

import pluralize from 'pluralize';
import { ArgOptions } from 'type-graphql';
import { ResolverBuilder, ResolverType } from './resolver-builder';
import { IResolverBuilderProps } from './types';

interface ICreateManyResolverBuilderProps extends IResolverBuilderProps {
  argOptions?: ArgOptions;
  inputType: any;
}

export default class CreateMany extends ResolverBuilder {
  public readonly props: ICreateManyResolverBuilderProps;

  public readonly type = ResolverType.CreateMany;

  constructor(props?: ICreateManyResolverBuilderProps) {
    super(props);
  }

  getResolverName(suffix: string): string {
    return `create${pluralize.plural(suffix)}`;
  }
}
