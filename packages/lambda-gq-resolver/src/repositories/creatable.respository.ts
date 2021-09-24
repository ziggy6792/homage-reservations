import { createToKeyFn, metadataForModel, ModelConstructor, toKey } from '@shiftcoders/dynamo-easy';
import _ from 'lodash';
import Creatable from 'src/domain/interfaces/creatable';
import Context from 'src/typegraphql-setup/context';
import DynamoStore from 'src/utils/dynamo-easy/dynamo-store';
import { Inject, Service } from 'typedi';

@Service()
export default class CreatableRepository<T extends Creatable> extends DynamoStore<T> {
  constructor(modelClazz: ModelConstructor<T>, @Inject('context') protected readonly context: Context) {
    super(modelClazz, context.requestId, context.requestCache);
  }

  getModelClazz(): ModelConstructor<T> {
    return this.myModelClazz;
  }

  getModelClazzName(): string {
    const metadata = metadataForModel(this.getModelClazz());
    return metadata.modelOptions.clazzName;
  }

  getKeyMap(entity: Partial<T>): any {
    const metadata = metadataForModel(this.getModelClazz());
    const partitionKey = metadata.getPartitionKey();
    const sortKey = metadata.getSortKey();
    // return toKey(entity, this.getModelClazz());
    return _.pickBy(entity, (value, key) => [partitionKey, sortKey].filter(_.identity).includes(key as any));
  }

  getKeyValues(entity: Partial<T>): { partitionKey: any; sortKey?: any } {
    const metadata = metadataForModel(this.getModelClazz());
    const partitionKey = metadata.getPartitionKey();
    const sortKey = metadata.getSortKey();
    if (!sortKey) {
      return { partitionKey: entity[partitionKey] };
    }
    return { partitionKey: entity[partitionKey], sortKey: entity[sortKey] };
  }
}
