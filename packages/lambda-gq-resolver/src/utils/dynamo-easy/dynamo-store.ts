/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable class-methods-use-this */
/* eslint-disable new-cap */
/* eslint-disable max-classes-per-file */
import {
  BatchGetSingleTableRequest,
  DynamoDbWrapper,
  DynamoStore as EasyDynamoStore,
  GetRequest,
  ModelConstructor,
  PutRequest,
  QueryRequest,
  UpdateRequest,
  update,
  DeleteRequest,
  attribute,
  Metadata,
  metadataForModel,
  ScanRequest,
} from '@shiftcoders/dynamo-easy';
import Creatable from 'src/domain/interfaces/creatable';
import _ from 'lodash';
import dynamoDB from 'src/utils/dynamo-db';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import RequestCache from './request-cache';

class MyDynamoDbWrapper extends DynamoDbWrapper {
  requestCache: RequestCache;

  constructor(db: DynamoDB, requestCache: RequestCache) {
    super(db);

    this.requestCache = requestCache;
  }

  hasRequestCache() {
    return !!this.requestCache;
  }

  clearRequestCache() {
    if (this.hasRequestCache()) {
      this.requestCache.clearAll();
    }
  }
}

class DynamoStore<T extends Creatable> extends EasyDynamoStore<T> {
  protected myModelClazz: ModelConstructor<T>;

  private readonly myDynamoDBWrapper: MyDynamoDbWrapper;

  private readonly metaData: Metadata<T>;

  constructor(modelClazz: ModelConstructor<T>, requestId?: string, requestCache?: RequestCache) {
    super(modelClazz, dynamoDB);
    this.myDynamoDBWrapper = new MyDynamoDbWrapper(this.dynamoDB, requestCache);
    this.myModelClazz = modelClazz;
    this.metaData = metadataForModel(this.myModelClazz);
  }

  put(item: T): PutRequest<T> {
    return new MyPutRequest(this.myDynamoDBWrapper, this.myModelClazz, item);
  }

  update(partitionKey: any, sortKey?: any): MyUpdateRequest<T> {
    const updateRequest = new MyUpdateRequest(this.myDynamoDBWrapper, this.myModelClazz, partitionKey, sortKey);
    // modifiedAt is private so i need to cast to any
    updateRequest.updateAttribute('modifiedAt' as any).set(Creatable.getTimestamp());
    return updateRequest;
  }

  updateItem(item: Partial<T>): MyUpdateRequest<T> {
    const partitionKey = this.metaData.getPartitionKey();
    const sortKey = this.metaData.getSortKey();

    // modifiedAt is removed and then added back in by this.update
    // ToDo clean this up
    const updateValues = _.omit(
      item,
      [partitionKey, sortKey, 'modifiedAt'].filter((v) => !!v)
    );

    if (!item[partitionKey]) {
      throw new Error(`Partition key "${partitionKey}" not included in ${JSON.stringify(item)}`);
    }
    //

    if (sortKey && !item[sortKey]) {
      throw new Error(`Sort key "${sortKey}" not included in ${JSON.stringify(item)}`);
    }

    return this.update(item[partitionKey], item[sortKey])
      .ifExists()
      .values(updateValues as any);
  }

  get(partitionKey: any, sortKey?: any): GetRequest<T> {
    const getRequest = new MyGetRequest(this.myDynamoDBWrapper, this.myModelClazz, partitionKey, sortKey);
    return getRequest;
  }

  query(): MyQueryRequest<T> {
    const queryRequest = new MyQueryRequest(this.myDynamoDBWrapper, this.myModelClazz);

    return queryRequest;
  }

  scan(): MyScanRequest<T> {
    const scanRequest = new MyScanRequest(this.myDynamoDBWrapper, this.myModelClazz);
    return scanRequest;
  }

  batchGet(keys: Partial<T>[]): MyBatchGetSingleTableRequest<T> {
    const request = new MyBatchGetSingleTableRequest(this.myDynamoDBWrapper, this.myModelClazz, keys);
    return request;
  }

  batchGetChunks(batchChunks: Partial<T>[][]): MyBatchGetSingleTableRequest<T>[] {
    const fns = batchChunks.map((batchChunk) => this.batchGet(batchChunk));
    return fns;
  }

  getAndDelete(partitionKey: any, sortKey?: any): MyGetAndDeleteRequest<T> {
    const getRequest = new MyGetAndDeleteRequest(this.myDynamoDBWrapper, this.myModelClazz, partitionKey, sortKey);
    return getRequest;
  }

  // Had to hack this as BatchWriteSingleTableRequest is not properly exported from dynamo-easy
  // myBatchWrite(): IMyBatchWriteSingleTableRequest<T> {
  //   let request = super.batchWrite();

  //   const batchWrite = () => super.batchWrite();

  //   class MyBatchWriteSingleTableRequest<T extends Creatable> {
  //     put(items: T[]): typeof request {
  //       items.forEach((item) => {
  //         item.preSave();
  //       });

  //       return request.put(items as any[]);
  //     }

  //     putChunks(batchChunks: T[][]): typeof request[] {
  //       batchChunks.forEach((chunk) => {
  //         chunk.forEach((item) => {
  //           item.preSave();
  //         });
  //       });

  //       const fns = batchChunks.map((batchChunk) => {
  //         request = batchWrite();
  //         return request.put(batchChunk as any[]);
  //       });

  //       return fns;
  //     }
  //   }

  //   return new MyBatchWriteSingleTableRequest();
  // }
}
const mapCreatible = <T extends Creatable>(loadedValues: T, clazzType: any): T => {
  const creatable: T = new clazzType();
  creatable.mapIn(loadedValues);
  return creatable;
};

export class MyQueryRequest<T extends Creatable> extends QueryRequest<T> {
  private myModelClazz: ModelConstructor<T>;

  public dynamoDBWrapper: MyDynamoDbWrapper;

  constructor(wrapper: MyDynamoDbWrapper, modelClazz: ModelConstructor<T>) {
    super(wrapper, modelClazz);
    this.myModelClazz = modelClazz;
  }

  async myExecFetchAll(): Promise<T[]> {
    return super.execFetchAll();
  }

  async execFetchAll(): Promise<T[]> {
    let laodedEnties: T[];

    if (this.dynamoDBWrapper.hasRequestCache()) {
      laodedEnties = (await this.dynamoDBWrapper.requestCache.query(this)) as T[];
    } else {
      laodedEnties = await super.execFetchAll();
    }
    const mappedResponse = laodedEnties.map((loadedValues) => mapCreatible(loadedValues, this.myModelClazz));
    return mappedResponse;
  }

  async execSingle(): Promise<T> {
    let laodedEntiy: T;

    if (this.dynamoDBWrapper.hasRequestCache()) {
      const laodedEnties = (await this.dynamoDBWrapper.requestCache.query(this)) as T[];
      [laodedEntiy] = laodedEnties.length > 0 ? laodedEnties : null;
    } else {
      laodedEntiy = await super.execSingle();
    }
    if (!laodedEntiy) {
      throw new Error('Not found');
    }
    const mappedResponse = mapCreatible(laodedEntiy, this.myModelClazz);
    return mappedResponse;
  }
}

class MyScanRequest<T extends Creatable> extends ScanRequest<T> {
  private myModelClazz: ModelConstructor<T>;

  constructor(wrapper: MyDynamoDbWrapper, modelClazz: ModelConstructor<T>) {
    super(wrapper, modelClazz);
    this.myModelClazz = modelClazz;
  }

  async execFetchAll(): Promise<T[]> {
    const response = await super.execFetchAll();
    const mappedResponse = response.map((loadedValues) => mapCreatible(loadedValues, this.myModelClazz));
    return mappedResponse;
  }

  // ToDo: Not sure why the super method doesn't work
  async execSingle(): Promise<T> {
    const response = await super.limit(1).execFetchAll();
    if (response?.length < 1) {
      return null;
    }
    return response[0];
  }
}

class MyGetRequest<T extends Creatable> extends GetRequest<T> {
  protected myModelClazz: ModelConstructor<T>;

  protected myPartitionKey: any;

  protected mySortKey: any;

  public dynamoDBWrapper: MyDynamoDbWrapper;

  constructor(wrapper: MyDynamoDbWrapper, modelClazz: ModelConstructor<T>, partitionKey, sortKey) {
    super(wrapper, modelClazz, partitionKey, sortKey);
    this.myModelClazz = modelClazz;
    this.myPartitionKey = partitionKey;
    this.mySortKey = sortKey;
  }

  async exec(): Promise<T> {
    let laodedEntity: T = null;

    if (this.dynamoDBWrapper.hasRequestCache()) {
      laodedEntity = (await this.dynamoDBWrapper.requestCache.getOne(this)) as T;
    } else {
      laodedEntity = await super.exec();
    }

    if (!laodedEntity) throw new Error(`Item not found ${JSON.stringify(this.params)}`);

    return mapCreatible(laodedEntity, this.myModelClazz);
  }
}

class MyGetAndDeleteRequest<T extends Creatable> extends MyGetRequest<T> {
  public dynamoDBWrapper: MyDynamoDbWrapper;

  async exec(): Promise<T> {
    const loadedValues = await super.exec();
    const deleteRequerst = new DeleteRequest(this.dynamoDBWrapper, this.modelClazz, this.myPartitionKey, this.mySortKey);
    await deleteRequerst.exec();
    this.dynamoDBWrapper.clearRequestCache();
    return loadedValues;
  }
}

class MyBatchGetSingleTableRequest<T extends Creatable, T2 = T> extends BatchGetSingleTableRequest<T> {
  private myModelClazz: ModelConstructor<T>;

  private keys: Array<Partial<T>>;

  public dynamoDBWrapper: MyDynamoDbWrapper;

  constructor(dynamoDBWrapper: MyDynamoDbWrapper, modelClazz: ModelConstructor<T>, keys: Array<Partial<T>>) {
    super(dynamoDBWrapper, modelClazz, keys);
    this.keys = keys;
    this.myModelClazz = modelClazz;
  }

  async exec(): Promise<T[]> {
    let response: T[];

    if (this.dynamoDBWrapper.hasRequestCache()) {
      const getRequests = this.keys.map((key) => {
        const metadata = metadataForModel(this.myModelClazz);
        const partitionKey = metadata.getPartitionKey();
        const sortKey = metadata.getSortKey();
        const getRequest = new GetRequest(this.dynamoDBWrapper, this.myModelClazz, key[partitionKey], key[sortKey]);
        return getRequest;
      });
      response = (await this.dynamoDBWrapper.requestCache.getMany(getRequests)) as T[];
    } else {
      response = await super.exec();
    }

    const mappedResponse = response.map((loadedValues) => mapCreatible(loadedValues, this.myModelClazz));
    return mappedResponse;
  }
}
//

// class MyBatchWriteSingleTableRequest<T extends Creatable, T2 = T> extends BatchWriteSingleTableRequest<T> {
//     private myModelClazz: ModelConstructor<T>;

//     constructor(dynamoDBWrapper: MyDynamoDbWrapper, modelClazz: ModelConstructor<T>) {
//         super(dynamoDBWrapper, modelClazz);
//         this.myModelClazz = modelClazz;
//     }

//     async exec(): Promise<void> {
//         const response = await super.exec();
//         // const mappedResponse = response.map((loadedValues) => mapCreatible(loadedValues, this.myModelClazz));
//         // return response;
//     }
// }

class MyUpdateRequest<T extends Creatable, T2 extends Creatable | void = void> extends UpdateRequest<T, T2> {
  private myModelClazz: ModelConstructor<T>;

  public dynamoDBWrapper: MyDynamoDbWrapper;

  constructor(wrapper: MyDynamoDbWrapper, modelClazz: ModelConstructor<T>, partitionKey, sortKey) {
    super(wrapper, modelClazz, partitionKey, sortKey);
    this.myModelClazz = modelClazz;
  }

  async exec(): Promise<T2> {
    const loadedValues = await super.exec();
    this.dynamoDBWrapper.clearRequestCache();

    if (typeof loadedValues === 'object' && loadedValues !== null) {
      return (mapCreatible((loadedValues as unknown) as T, this.myModelClazz) as unknown) as T2;
    }
    return null;
  }

  values(values: Partial<T>): this {
    // ToDo : Add option to skip nulls so they are not removed
    const updateOperations = Object.keys(values).map((key) => (values[key] ? update(key).set(values[key]) : update(key).remove()));
    return this.operations(...updateOperations);
  }

  ifExists() {
    const partitionKey = this.metadata.getPartitionKey();
    let returnContition = this.onlyIf(attribute(partitionKey).attributeExists());
    const sortKey = this.metadata.getSortKey();
    if (sortKey) {
      returnContition = returnContition.onlyIf(attribute(sortKey).attributeExists());
    }
    return returnContition;
  }
}

class MyPutRequest<T extends Creatable, T2 extends Creatable | void = void> extends PutRequest<T, T2> {
  public dynamoDBWrapper: MyDynamoDbWrapper;

  private myItem: T;

  constructor(wrapper: MyDynamoDbWrapper, modelClazz: ModelConstructor<T>, item: T) {
    super(wrapper, modelClazz, item);
    this.myItem = item;
  }

  async exec(): Promise<T2> {
    this.myItem.preSave();
    const result = await super.exec();
    this.dynamoDBWrapper.clearRequestCache();
    return result;
  }
}

export default DynamoStore;
