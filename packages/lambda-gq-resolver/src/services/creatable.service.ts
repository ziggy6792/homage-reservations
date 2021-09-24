/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */
import { attribute, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT } from '@shiftcoders/dynamo-easy';
import _ from 'lodash';
import Creatable from 'src/domain/interfaces/creatable';
import CreatableRepository from 'src/repositories/creatable.respository';
import Context from 'src/typegraphql-setup/context';
import BatchWriteRequest from 'src/utils/dynamo-easy/batch-write-request';
import DynamoStore from 'src/utils/dynamo-easy/dynamo-store';
import { mapDbException } from 'src/utils/utility';
import { Inject } from 'typedi';

export default class CreatableService<T extends Creatable = Creatable> {
  protected repository: CreatableRepository<T>;

  @Inject('context') protected readonly context: Context;

  constructor() {
    console.log('CreatableService!!!', this.context);
  }

  async getOne(partitionKey: string, sortKey?: string): Promise<T> {
    if (!partitionKey) {
      return null;
    }
    // console.log('hi', this.context.requestId);
    // this.getDescendants(partitionKey);
    return this.repository.get(partitionKey, sortKey).exec();
  }

  async getMany(limit?: number): Promise<T[]> {
    let scanRequest = this.repository.scan();
    if (limit) {
      scanRequest = scanRequest.limit(limit);
    }
    return scanRequest.exec();
  }

  public async createOne(creatable: Partial<T>): Promise<T> {
    const entity = Object.assign(new (this.repository.getModelClazz() as any)(), creatable);
    try {
      await this.repository.put(entity).ifNotExists().exec();
      return entity;
    } catch (err) {
      throw mapDbException(err, `${this.repository.getModelClazzName()} ${JSON.stringify(this.repository.getKeyMap(entity))} already exists`);
    }
  }

  public async createMany(inputs: T[]): Promise<T[]> {
    const createFns = inputs.map((entity) => async () => this.createOne(entity));
    // await Competition.store.myBatchWrite().put(batchPutCompetitions).exec();
    const createdEnties = await Promise.all(createFns.map((fn) => fn()));
    return createdEnties;
  }

  public async updateOne(input: Partial<T>): Promise<T> {
    try {
      const updatedEntity = await this.repository.updateItem(input).ifExists().returnValues('ALL_NEW').exec();
      return updatedEntity;
    } catch (err) {
      const entity = Object.assign(new (this.repository.getModelClazz() as any)(), input);
      throw mapDbException(err, `${this.repository.getModelClazzName()} ${JSON.stringify(this.repository.getKeyMap(entity))} does not exist`);
    }
  }

  public async updateMany(inputs: Partial<T>[]): Promise<T[]> {
    const createFns = inputs.map((input) => async () => this.updateOne(input));
    const updatedEntities = await Promise.all(createFns.map((fn) => fn()));
    return updatedEntities;
  }

  public async deleteOne(partitionKey: string, sortKey?: string): Promise<T> {
    const entity = await this.repository.getAndDelete(partitionKey, sortKey).exec();

    // const decendents = await entity.getDescendants();
    // await Promise.all(new BatchWriteRequest().deleteChunks(_.chunk(decendents, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec()));
    const deleteFn = await this.getDescendantsDeleteFn(entity);
    await deleteFn();
    return entity;
  }

  public async deleteMany(keys: Partial<T>[]): Promise<void> {
    await Promise.all(new BatchWriteRequest().deleteChunks(_.chunk(keys as any[], BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec()));
  }

  public async deleteOneEntity(creatable: Partial<T>): Promise<T> {
    const { partitionKey, sortKey } = this.repository.getKeyValues(creatable);
    return this.deleteOne(partitionKey, sortKey);
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public getKeyValues(entity: Partial<T>) {
    return this.repository.getKeyValues(entity);
  }

  public async getChildren(creatable: Creatable): Promise<Creatable[]> {
    return [];
  }

  async getDescendants(creatable: Creatable): Promise<Creatable[]> {
    const traverse = async (node: Creatable, childrenList: Creatable[] = []): Promise<Creatable[]> => {
      const creatableService = this.context.getServiceForModel(node.constructor as any) as CreatableService;
      const children = await creatableService.getChildren(node);
      for (const child of children) {
        childrenList.push(child);
        await traverse(child, childrenList);
      }
      return childrenList;
    };

    return traverse(creatable);
  }

  async getDescendantsDeleteFn(creatable: Creatable): Promise<() => Promise<Creatable[]>> {
    const decendents = await this.getDescendants(creatable);
    const deleteFn = async () => {
      await Promise.all(new BatchWriteRequest().deleteChunks(_.chunk(decendents, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec()));
      return decendents;
    };
    return deleteFn;
  }

  public async batchGet(keys: Partial<T>[]): Promise<T[]> {
    return _.flatten(await Promise.all(this.repository.batchGetChunks(_.chunk(keys, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec())));
  }

  public async find(filter: Partial<T>): Promise<T[]> {
    const request = this.repository.scan();
    const attFilter = filter ? Object.keys(filter).map((key) => attribute(key).equals(filter[key])) : [];
    return attFilter.length > 0 ? request.where(...attFilter).execFetchAll() : request.execFetchAll();
  }
}
