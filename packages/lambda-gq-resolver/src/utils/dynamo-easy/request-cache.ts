/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable class-methods-use-this */
/* eslint-disable new-cap */
/* eslint-disable max-classes-per-file */
import {
  BATCH_WRITE_MAX_REQUEST_ITEM_COUNT,
  TransactGetRequest,
  fromDb,
  QueryRequest,
  ScanRequest,
  ReadManyRequest,
  GetRequest,
} from '@shiftcoders/dynamo-easy';
import Creatable from 'src/domain/interfaces/creatable';
import _ from 'lodash';

import DataLoader from 'dataloader';
import * as DynamoDB from 'aws-sdk/clients/dynamodb';
import ddb from 'src/utils/dynamo-db';

export function fetchAll<T>(request: ScanRequest<T> | QueryRequest<T>, startKey?: DynamoDB.Key): Promise<T[]> {
  request.limit(ReadManyRequest.INFINITE_LIMIT);
  if (startKey) {
    request.exclusiveStartKey(startKey);
  }
  return request.execFullResponse().then((response) => {
    if (response.LastEvaluatedKey) {
      return fetchAll(request, response.LastEvaluatedKey).then((innerResponse) => [...response.Items, ...innerResponse]);
    }
    return response.Items;
  });
}

export default class RequestCache {
  private dataloaderGet: DataLoader<GetRequest<any>, Creatable>;

  private dataloaderQuery: DataLoader<QueryRequest<any>, Creatable[]>;

  private dynamoDB: DynamoDB;

  constructor(dynamoDB: DynamoDB = ddb) {
    this.dynamoDB = dynamoDB;

    const cacheKeyFn = (request: QueryRequest<any> | GetRequest<any>) => JSON.stringify(request.params);

    this.dataloaderGet = new DataLoader(
      async (keys: GetRequest<any>[]) => {
        const uniqueKeys = _.uniqWith(keys, _.isEqual);

        const itemsMap: { [key: string]: any } = {};

        const getItems = async (keys: GetRequest<any>[]) => {
          const batchRequest = new TransactGetRequest(dynamoDB);
          batchRequest.params.TransactItems = keys.map((getRequest) => ({ Get: getRequest.params }));
          const result = await batchRequest.execNoMap();
          console.log(`BATCH REQUEST: ${keys.length}`);

          const mapped = result.Responses.map((item, i) => (item?.Item ? fromDb(item.Item as any, keys[i].modelClazz) : null));

          keys.forEach((key, i) => {
            itemsMap[cacheKeyFn(key)] = mapped[i];
          });

          return mapped;
        };

        await Promise.all(_.chunk(uniqueKeys, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT).map((chunk) => getItems(chunk)));

        // console.log('itemsMap');
        // console.log(JSON.stringify(itemsMap));

        return keys.map((key) => itemsMap[cacheKeyFn(key)]);
      },
      { cache: true, cacheKeyFn }
    );

    this.dataloaderQuery = new DataLoader(
      async (keys: QueryRequest<any>[]) => {
        const uniqueKeys = _.uniqWith(keys, _.isEqual);

        const itemsMap: { [key: string]: any[] } = {};

        const doQuery = async (queryReq: QueryRequest<any>) => {
          console.log('doQuery!', queryReq.params);
          const results = await fetchAll(queryReq);
          itemsMap[cacheKeyFn(queryReq)] = results;
          return results;
        };

        await Promise.all(uniqueKeys.map((queryReq) => doQuery(queryReq)));

        console.log('itemsMap', JSON.stringify(itemsMap));

        return keys.map((key) => itemsMap[cacheKeyFn(key)]);
      },
      { cache: true, cacheKeyFn }
    );
  }

  getOne(key: GetRequest<any>) {
    return this.dataloaderGet.load(key);
  }

  getMany(keys: GetRequest<any>[]) {
    return this.dataloaderGet.loadMany(keys);
  }

  query(key: QueryRequest<any>) {
    return this.dataloaderQuery.load(key);
  }

  clearAll() {
    this.dataloaderGet.clearAll();
    this.dataloaderQuery.clearAll();
  }
}
