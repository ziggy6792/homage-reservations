import { commonConfig } from '@alpaca-backend/common';
import ScheduleItem from 'src/domain/models/schedule-item';
import ScheduleItemRepository from 'src/repositories/schedule-item.respository';
import { Service } from 'typedi';

import { attribute, or } from '@shiftcoders/dynamo-easy';
import _ from 'lodash';
import CreatableService from './creatable.service';

// this service will be global - shared by every request
@Service()
@Service({ id: ScheduleItem })
export class ScheduleItemService extends CreatableService<ScheduleItem> {
  constructor(protected readonly repository: ScheduleItemRepository) {
    super();
  }

  public async getScheduleItemsByScheduleIds(sheduleIds: string[]): Promise<ScheduleItem[]> {
    return this.repository
      .scan()
      .index(commonConfig.DB_SCHEMA.ScheduleItem.indexes.byStartTime.indexName)
      .where(or(...sheduleIds.map((sheduleId) => attribute('scheduleId').equals(sheduleId))))
      .execFetchAll();
  }

  public async getScheduleItemsByScheduleId(sheduleId: string): Promise<ScheduleItem[]> {
    return this.repository.query().index(commonConfig.DB_SCHEMA.ScheduleItem.indexes.bySchedule.indexName).wherePartitionKey(sheduleId).execFetchAll();
  }

  public async getScheduleItemBySchedulableId(sheduleId: string): Promise<ScheduleItem> {
    return this.repository.query().index(commonConfig.DB_SCHEMA.ScheduleItem.indexes.bySchedulable.indexName).wherePartitionKey(sheduleId).execSingle();
  }
}
