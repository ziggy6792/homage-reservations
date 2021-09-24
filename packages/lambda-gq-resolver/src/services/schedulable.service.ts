/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Schedulable from 'src/domain/interfaces/schedulable';
import ScheduleItem from 'src/domain/models/schedule-item';

// this service will be recreated for each request (scoped)
export interface SchedulableService {
  getScheduleItem(schedulable: Schedulable): Promise<ScheduleItem>;
  getStartTime(schedulable: Schedulable): Promise<Date>;
}
