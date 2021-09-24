/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { InterfaceType } from 'type-graphql';
import DataEntity from './data-entity';

// Has no fields but is resolved by schedulable resolver
@InterfaceType({
  // implements: DataEntity,
})
abstract class Schedulable extends DataEntity {}

export default Schedulable;
