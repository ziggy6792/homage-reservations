import { commonConfig } from '@alpaca-backend/common';
import RiderRegistration from 'src/domain/models/rider-registration';
import User from 'src/domain/models/user';
import RiderRegistrationRepository from 'src/repositories/rider-registration.respository';
import { Service } from 'typedi';

import CreatableService from './creatable.service';

// this service will be global - shared by every request
@Service()
@Service({ id: RiderRegistration })
export class RiderRegistrationService extends CreatableService<RiderRegistration> {
  constructor(protected readonly repository: RiderRegistrationRepository) {
    super();
  }

  public async getRiderRegistrationsByCompetitionId(competitionId: string): Promise<RiderRegistration[]> {
    return this.repository
      .query()
      .index(commonConfig.DB_SCHEMA.RiderRegistration.indexes.byCompetition.indexName)
      .wherePartitionKey(competitionId)
      .execFetchAll();
  }

  public async getIsRegistered(competitionId: string): Promise<boolean> {
    const riderRegistations = await this.getRiderRegistrationsByCompetitionId(competitionId);
    return !!riderRegistations.find((rider) => rider.userId === this.context.identity.user?.username);
  }

  public async hasDemoRiders(competitionId: string): Promise<boolean> {
    const riderRegistations = await this.getRiderRegistrationsByCompetitionId(competitionId);
    return !!riderRegistations.find((ra) => User.IsDemoUserId(ra.userId));
  }
}
