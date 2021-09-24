import User from 'src/domain/models/user';
import Context from 'src/typegraphql-setup/context';
import { Inject, Service } from 'typedi';
import CreatableRepository from './creatable.respository';

@Service()
export default class UserRepository extends CreatableRepository<User> {
  constructor(@Inject('context') protected readonly context: Context) {
    super(User, context);
    console.log('UserRepository requestId', this.context.requestId);
  }
}
