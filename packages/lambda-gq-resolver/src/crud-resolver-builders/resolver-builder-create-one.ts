/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */

import { ArgOptions } from 'type-graphql';
import { ResolverBuilder, ResolverType } from './resolver-builder';
import { IResolverBuilderProps } from './types';

interface ICreateOneResolverBuilderProps extends IResolverBuilderProps {
  argOptions?: ArgOptions;
  inputType: any;
}

export default class CreateOne extends ResolverBuilder {
  public readonly props: ICreateOneResolverBuilderProps;

  public readonly type = ResolverType.CreateOne;

  constructor(props?: ICreateOneResolverBuilderProps) {
    super(props);
  }

  getResolverName(suffix: string): string {
    return `create${suffix}`;
  }
}
