/* eslint-disable no-useless-constructor */

import { AdvancedOptions } from 'type-graphql/dist/decorators/types';
import { IResolverBuilderProps } from './types';

export enum ResolverType {
  GetOne = 'GetOne',
  GetMany = 'GetMany',
  CreateOne = 'CreateOne',
  CreateMany = 'CreateMany',
  UpdateOne = 'UpdateOne',
  UpdateMany = 'UpdateMany',
  DeleteOne = 'DeleteOne',
}

export abstract class ResolverBuilder {
  protected props: IResolverBuilderProps;

  public readonly type: ResolverType;

  constructor(props: IResolverBuilderProps) {
    this.props = props || { middleware: [] };
    this.props.middleware = this.props.middleware || [];
  }

  public getResolverOptions(suffix: string): AdvancedOptions {
    return { name: this.getResolverName(suffix), ...this.props.resolverOptions };
  }

  protected abstract getResolverName(suffix: string): string;
}
