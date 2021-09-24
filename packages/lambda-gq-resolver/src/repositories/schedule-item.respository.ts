import ScheduleItem from 'src/domain/models/schedule-item';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class ScheduleItemRepository extends CreatableRepository<ScheduleItem> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(ScheduleItem, context);
    console.log('ScheduleItemRepository requestId', this.context.requestId);
  }
}
