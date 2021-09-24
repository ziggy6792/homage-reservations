import Competition from 'src/domain/models/competition';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class CompetitionRepository extends CreatableRepository<Competition> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(Competition, context);
    console.log('CompetitionRepository requestId', this.context.requestId);
  }
}
