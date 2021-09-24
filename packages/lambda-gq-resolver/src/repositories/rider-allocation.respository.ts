import RiderAllocation from 'src/domain/models/rider-allocation';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class RiderAlloicationRepositiory extends CreatableRepository<RiderAllocation> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(RiderAllocation, context);
    console.log('RiderAllocationRepository requestId', this.context.requestId);
  }
}
