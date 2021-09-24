/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */

import { ArgOptions } from 'type-graphql';
import { ResolverBuilder, ResolverType } from './resolver-builder';
import { IResolverBuilderProps } from './types';

interface IUpdateOneResolverBuilderProps extends IResolverBuilderProps {
  argOptions?: ArgOptions;
  inputType: any;
}

export default class UpdateOne extends ResolverBuilder {
  public readonly props: IUpdateOneResolverBuilderProps;

  public readonly type = ResolverType.UpdateOne;

  constructor(props?: IUpdateOneResolverBuilderProps) {
    super(props);
  }

  getResolverName(suffix: string): string {
    return `update${suffix}`;
  }
}
