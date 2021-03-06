/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import { Field, InterfaceType } from 'type-graphql';
import getUniqueTimestamp from 'src/utils/get-unique-timestamp';
import DynamoStore from 'src/utils/dynamo-easy/dynamo-store';
import { metadataForModel, Property } from '@shiftcoders/dynamo-easy';
import dateMapper from 'src/utils/dynamo-easy/mappers/date-mapper';

@InterfaceType()
abstract class Creatable {
  readonly __typename: string;

  @Field()
  @Property({ mapper: dateMapper })
  readonly createdAt: Date;

  @Field()
  @Property({ mapper: dateMapper })
  private modifiedAt: Date;

  constructor() {
    this.__typename = this.constructor.name;
    this.createdAt = Creatable.getTimestamp();
  }

  mapIn(loadedValues: any): void {
    // Object.assign(this, { ...merge(this, loadedValues) });
    _.merge(this, loadedValues);
  }

  static getTimestamp(): Date {
    return getUniqueTimestamp();
  }

  preSave(): void {
    this.setModifiedAt();
  }

  setModifiedAt(): void {
    // ToDo: Clean this up
    // Object.assign(this, { modifiedAt: this.modifiedAt ? Creatable.getTimestamp() : this.createdAt });
    this.modifiedAt = this.modifiedAt ? Creatable.getTimestamp() : this.createdAt;
  }

  getModifiedAt(): Date {
    return this.modifiedAt;
  }

  getKeys(): any {
    // const classType = this.constructor as typeof Creatable;
    const metadata = metadataForModel(this.constructor as any);
    const keys = [metadata.getPartitionKey(), metadata.getSortKey()].filter((v) => !!v);
    return _.pick(this, keys);
  }

  async getChildren(): Promise<Creatable[]> {
    return [];
  }

  async getDescendants(): Promise<Creatable[]> {
    const traverse = async (node: Creatable, childrenList: Creatable[] = []): Promise<Creatable[]> => {
      const children = await node.getChildren();
      for (const child of children) {
        childrenList.push(child);
        await traverse(child, childrenList);
      }
      return childrenList;
    };

    return traverse(this);
  }
}

export default Creatable;
