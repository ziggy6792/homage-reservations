/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import { ResolverBuilder, ResolverType } from 'src/crud-resolver-builders/resolver-builder';
import GetOne from 'src/crud-resolver-builders/resolver-builder-get-one';
import Round from 'src/domain/models/round';
import CreatableService from 'src/services/creatable.service';
import { CreatableClassType } from 'src/types';
import { Arg, ID, Query, Resolver, Int, Mutation, UseMiddleware } from 'type-graphql';
import { conditional } from 'conditional-decorator';
import GetMany from 'src/crud-resolver-builders/resolver-builder-get-many';
import CreateOne from 'src/crud-resolver-builders/resolver-builder-create-one';
import CreateMany from 'src/crud-resolver-builders/resolver-builder-create-many';
import UpdateOne from 'src/crud-resolver-builders/resolver-builder-update-one';
import UpdateMany from 'src/crud-resolver-builders/resolver-builder-update-many';
import DeleteOne from 'src/crud-resolver-builders/resolver-builder-delete-one';
import Creatable from 'src/domain/interfaces/creatable';
import { CreatableResolver } from './creatable.resolver';

interface IKeys {
  partitionKey: string;
  sortKey?: string;
}

interface ICrudConfigProps {
  suffix: string;
  returnType: CreatableClassType;
  idFields?: IKeys;
  reolverBuilders: ResolverBuilder[];
}

export class CrudCofig {
  props: ICrudConfigProps;

  public getOne: GetOne | null;

  public getMany: GetMany | null;

  public createOne: CreateOne | null;

  public createMany: CreateMany | null;

  public updateOne: UpdateOne | null;

  public updateMany: UpdateMany | null;

  public deleteOne: DeleteOne | null;

  constructor(props: ICrudConfigProps) {
    this.props = props;
    this.getOne = props.reolverBuilders.find(({ type }) => type === ResolverType.GetOne) as GetOne;
    this.getMany = props.reolverBuilders.find(({ type }) => type === ResolverType.GetMany) as GetMany;
    this.createOne = props.reolverBuilders.find(({ type }) => type === ResolverType.CreateOne) as CreateOne;
    this.createMany = props.reolverBuilders.find(({ type }) => type === ResolverType.CreateMany) as CreateMany;
    this.updateOne = props.reolverBuilders.find(({ type }) => type === ResolverType.UpdateOne) as UpdateOne;
    this.updateMany = props.reolverBuilders.find(({ type }) => type === ResolverType.UpdateMany) as UpdateMany;
    this.deleteOne = props.reolverBuilders.find(({ type }) => type === ResolverType.DeleteOne) as DeleteOne;
  }
}

export const buildCrudResolver = <T extends Creatable>(crudConfig: CrudCofig): typeof CreatableResolver => {
  const { getOne, getMany, createOne, createMany, updateOne, updateMany, deleteOne } = crudConfig;

  @Resolver()
  class GeneratedResolver extends CreatableResolver<T> {
    @conditional(!!getOne, Query(() => crudConfig.props.returnType, getOne?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(getOne?.props.middleware)
    async queryGet(@Arg('id', () => ID, getOne?.props.argOptions) id: string): Promise<T> {
      return this.props.service.getOne(id);
    }

    @conditional(!!getMany, Query(() => [crudConfig.props.returnType], getMany?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(getMany?.props.middleware)
    async queryGetMany(@Arg('limit', () => Int, { nullable: true }) limit: number): Promise<T[]> {
      return this.props.service.getMany(limit);
    }

    @conditional(!!createOne, Mutation(() => crudConfig.props.returnType, createOne?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(createOne?.props.middleware)
    async mutationCreateOne(@Arg('input', () => createOne?.props.inputType, createOne?.props.argOptions) input: any): Promise<T> {
      return this.props.service.createOne(input);
    }

    @conditional(!!createMany, Mutation(() => [crudConfig.props.returnType], createMany?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(createMany?.props.middleware)
    async mutationCreateMany(@Arg('input', () => [createMany?.props.inputType], createMany?.props.argOptions) input: T[]): Promise<T[]> {
      return this.props.service.createMany(input);
    }

    @conditional(!!updateOne, Mutation(() => crudConfig.props.returnType, updateOne?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(updateOne?.props.middleware)
    async mutationUpdateOne(@Arg('input', () => updateOne?.props.inputType, updateOne?.props.argOptions) input: any): Promise<T> {
      return this.props.service.updateOne(input);
    }

    @conditional(!!updateMany, Mutation(() => [crudConfig.props.returnType], updateMany?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(updateMany?.props.middleware)
    async mutationUpdateMany(@Arg('input', () => [updateMany?.props.inputType], updateMany?.props.argOptions) input: any[]): Promise<T[]> {
      return this.props.service.updateMany(input);
    }

    @conditional(deleteOne && !deleteOne.props.inputType, Mutation(() => crudConfig.props.returnType, deleteOne?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(deleteOne?.props.middleware)
    async mutationDeleteOneId(@Arg('id', () => ID) id: string): Promise<T> {
      return this.props.service.deleteOne(id);
    }

    @conditional(!!deleteOne?.props.inputType, Mutation(() => crudConfig.props.returnType, deleteOne?.getResolverOptions(crudConfig.props.suffix)))
    @UseMiddleware(deleteOne?.props.middleware)
    async mutationDeleteOneInput(@Arg('input', () => deleteOne?.props.inputType, deleteOne?.props.argOptions) input: T): Promise<T> {
      const { partitionKey, sortKey } = this.props.service.getKeyValues(input);
      return this.props.service.deleteOne(partitionKey, sortKey);
    }
  }
  return GeneratedResolver as typeof CreatableResolver;
};
