/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */

import { ArgOptions } from 'type-graphql';
import { ResolverBuilder, ResolverType } from './resolver-builder';
import { IResolverBuilderProps } from './types';

interface IGetOneResolverBuilderProps extends IResolverBuilderProps {
  argOptions?: ArgOptions;
}

export default class GetOne extends ResolverBuilder {
  public readonly props: IGetOneResolverBuilderProps;

  public readonly type = ResolverType.GetOne;

  constructor(props?: IGetOneResolverBuilderProps) {
    super(props);
  }

  getResolverName(suffix: string): string {
    return `get${suffix}`;
  }
}
