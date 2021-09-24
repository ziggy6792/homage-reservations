import { InterfaceType } from 'type-graphql';
import DataEntity from 'src/domain/interfaces/data-entity';

// Has no fields but is resolved by schedule resolver
@InterfaceType({
  // implements: DataEntity,
})
abstract class Schedule extends DataEntity {}

export default Schedule;
