/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */

import { ArgOptions } from 'type-graphql';
import { ResolverBuilder, ResolverType } from './resolver-builder';
import { IResolverBuilderProps } from './types';

interface IDeleteOneResolverBuilderProps extends IResolverBuilderProps {
  argOptions?: ArgOptions;
  inputType?: any;
}

export default class DeleteOne extends ResolverBuilder {
  public readonly props: IDeleteOneResolverBuilderProps;

  public type = ResolverType.DeleteOne;

  constructor(props?: IDeleteOneResolverBuilderProps) {
    super(props);
  }

  getResolverName(suffix: string): string {
    return `delete${suffix}`;
  }
}
