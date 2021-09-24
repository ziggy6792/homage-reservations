import RiderRegistration from 'src/domain/models/rider-registration';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class RiderAlloicationRepositiory extends CreatableRepository<RiderRegistration> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(RiderRegistration, context);
    console.log('RiderRegistrationRepository requestId', this.context.requestId);
  }
}
