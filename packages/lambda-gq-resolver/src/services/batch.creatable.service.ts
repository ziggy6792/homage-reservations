/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
import { Inject, Service } from 'typedi';
import _ from 'lodash';
import Context from 'src/typegraphql-setup/context';
import Creatable from 'src/domain/interfaces/creatable';
import BatchWriteRequest from 'src/utils/dynamo-easy/batch-write-request';
import { BATCH_WRITE_MAX_REQUEST_ITEM_COUNT } from '@shiftcoders/dynamo-easy';

// this service is used to batch write request together for performance optimization
@Service()
export class BatchCreatableService {
  constructor(@Inject('context') protected readonly context: Context) {}

  async batchCreate(creatables: Creatable[]): Promise<void> {
    await Promise.all(new BatchWriteRequest().putChunks(_.chunk(creatables, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec()));
    this.context.clearRequestCache();
  }

  async batchDelete(creatables: Creatable[]): Promise<void> {
    await Promise.all(new BatchWriteRequest().deleteChunks(_.chunk(creatables, BATCH_WRITE_MAX_REQUEST_ITEM_COUNT)).map((req) => req.exec()));
    this.context.clearRequestCache();
  }
}
