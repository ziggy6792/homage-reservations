/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */
import { Inject, Service } from 'typedi';
import { Resolver, FieldResolver, Root } from 'type-graphql';
import Schedule from 'src/domain/interfaces/schedule';
import { ScheduleService } from 'src/services/schedule.service';
import Context from 'src/typegraphql-setup/context';
import { CreatableClassType } from 'src/types';
import { ScheduleItemList } from 'src/domain/objects/lists';

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver(() => Schedule)
export class ScheduleResolver {
  constructor(@Inject('context') private readonly context: Context) {}

  getService(schedule: Schedule): ScheduleService {
    return this.context.getServiceForModel(schedule.constructor as CreatableClassType);
  }

  @FieldResolver(() => ScheduleItemList)
  async scheduleItems(@Root() schedule: Schedule): Promise<ScheduleItemList> {
    const scheduleService: ScheduleService = this.getService(schedule);
    const list = new ScheduleItemList();
    list.items = await scheduleService.getScheduleItems(schedule);
    return list;
  }
}
