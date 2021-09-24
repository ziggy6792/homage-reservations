/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Schedule from 'src/domain/interfaces/schedule';
import ScheduleItem from 'src/domain/models/schedule-item';

export interface ScheduleService {
  getScheduleItems(schedule: Schedule): Promise<ScheduleItem[]>;
}

// @Field(() => ScheduleItemList)
// protected async scheduleItems(): Promise<ScheduleItemList> {
//   const list = new ScheduleItemList();
//   list.items = await this.getScheduleItems();
//   return list;
// }
