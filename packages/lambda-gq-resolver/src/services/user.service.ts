import { Service } from 'typedi';

import UserRepository from 'src/repositories/user.respository';
import User from 'src/domain/models/user';
import { commonConfig } from '@alpaca-backend/common';
import CreatableService from './creatable.service';

// this service will be global - shared by every request
@Service()
@Service({ id: User })
export class UserService extends CreatableService<User> {
  constructor(protected readonly repository: UserRepository) {
    super();
  }

  async getMany(limit?: number): Promise<User[]> {
    let scanRequest = this.repository.scan();
    if (limit) {
      scanRequest = scanRequest.limit(limit);
    }
    return scanRequest.index(commonConfig.DB_SCHEMA.User.indexes.byLastName.indexName).exec();
  }

  async getOne(partitionKey: string, sortKey?: string): Promise<User> {
    if (User.IsDemoUserId(partitionKey)) {
      return User.CreateDemoUser(partitionKey);
    }
    return super.getOne(partitionKey);
  }
}
