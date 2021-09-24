import Heat from 'src/domain/models/heat';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class HeatRepository extends CreatableRepository<Heat> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(Heat, context);
    console.log('HeatRepository requestId', this.context.requestId);
  }
}
