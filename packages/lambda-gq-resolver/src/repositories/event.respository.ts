import Event from 'src/domain/models/event';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class EventRepository extends CreatableRepository<Event> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(Event, context);
    console.log('EventRepository requestId', this.context.requestId);
  }
}
