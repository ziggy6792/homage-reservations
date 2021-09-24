import Round from 'src/domain/models/round';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class RoundRepository extends CreatableRepository<Round> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(Round, context);
    console.log('RoundRepository requestId', this.context.requestId);
  }
}
