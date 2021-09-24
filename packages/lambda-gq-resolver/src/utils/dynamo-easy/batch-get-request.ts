/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable class-methods-use-this */
/* eslint-disable new-cap */
/* eslint-disable max-classes-per-file */
import {
  DynamoDbWrapper,
  BatchGetRequest as EasyBatchGetRequest,
  ModelConstructor,
  BATCH_WRITE_MAX_REQUEST_ITEM_COUNT,
  metadataForModel,
} from '@shiftcoders/dynamo-easy';
import dynamoDB from 'src/utils/dynamo-db';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import Heat from 'src/domain/models/heat';
import Creatable from 'src/domain/interfaces/creatable';
import _ from 'lodash';

class BatchGetRequest extends EasyBatchGetRequest {
  private readonly myDynamoDBWrapper: DynamoDbWrapper;

  private readonly myTables: Array<ModelConstructor<any>> = [];

  constructor() {
    super(dynamoDB);
    this.myDynamoDBWrapper = new DynamoDbWrapper(dynamoDB);
    console.log('Custom constructor');
    // this.myDynamoDBWrapper.
  }

  getChunks(batchChunks: Creatable[][]): BatchGetRequest[] {
    const fns = batchChunks.map((batchChunk) => {
      const request = new BatchGetRequest();

      batchChunk.forEach((item) => {
        const modelClazz = item.constructor as ModelConstructor<any>;

        request.forModel(modelClazz, [item as any]);

        this.myTables.push(modelClazz);

        // check if table was already used in this request
      });
      return request;
    });

    fns[0].exec();

    return fns;
  }

  getAll(items: Creatable[]): Creatable[] {
    const batchChunks = _.chunk(items, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT);

    const fns = batchChunks.map((batchChunk) => {
      const request = new MyBatchGetSingleTableRequest();
      batchChunk.forEach((item) => {
        request.forModel(item.constructor as any, [item as any]);
      });
      return request;
    });

    return [];
  }

  async exec() {
    const response = await super.exec();
    console.log('Custom exec');
    console.log(JSON.stringify(response));
    console.log(JSON.stringify(this.params));
    // this.myTables;
    return response;
  }
}

export default BatchGetRequest;

class MyBatchGetSingleTableRequest extends EasyBatchGetRequest {
  // async exec(): Promise<any[]> {
  //   // const response = await super.exec();
  //   // const mappedResponse = response.map((loadedValues) => mapCreatible(loadedValues, this.myModelClazz));
  //   return await super.exec();
  // }

  async ecec() {
    const response = await super.exec();
    console.log('Custom exec');
    console.log(JSON.stringify(response));
    return response;
  }
}
