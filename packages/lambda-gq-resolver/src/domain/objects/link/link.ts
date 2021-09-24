/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';

@ObjectType()
export class LinkList {
  @Field((type) => [Link])
  items: Array<Link>;
}

export enum LinkType {
  EVENT = 'EVENT',
  COMPETITION = 'COMPETITION',
  HEAT = 'HEAT',
  ROUND = 'ROUND',
}

registerEnumType(LinkType, {
  name: 'LinkType', // this one is mandatory
});

@ObjectType()
class Link {
  constructor(type: LinkType, name: string, id?: string) {
    this.type = type;
    this.name = name;
    this.id = id;
  }

  @Field(() => LinkType)
  type: LinkType;

  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;
}

export default Link;
