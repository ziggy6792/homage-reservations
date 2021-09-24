/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Field, InterfaceType } from 'type-graphql';
import Identifiable from './identifiable';

@InterfaceType({
  // implements: Identifiable,
})
abstract class DataEntity extends Identifiable {
  @Field()
  name: string;

  @Field()
  longName: string;
}

export default DataEntity;
