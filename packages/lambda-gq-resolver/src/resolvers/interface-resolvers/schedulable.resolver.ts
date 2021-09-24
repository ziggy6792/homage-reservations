/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */
import { Inject, Service } from 'typedi';
import { Resolver, FieldResolver, Root } from 'type-graphql';
import Schedulable from 'src/domain/interfaces/schedulable';
import { SchedulableService } from 'src/services/schedulable.service';
import Context from 'src/typegraphql-setup/context';
import { CreatableClassType } from 'src/types';
import ScheduleItem from 'src/domain/models/schedule-item';

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver(() => Schedulable)
export class SchedulableResolver {
  constructor(@Inject('context') private readonly context: Context) {}

  getService(schedulable: Schedulable): SchedulableService {
    return this.context.getServiceForModel(schedulable.constructor as CreatableClassType);
  }

  @FieldResolver(() => ScheduleItem)
  async scheduleItem(@Root() schedulable: Schedulable): Promise<ScheduleItem> {
    const schedulableService: SchedulableService = this.getService(schedulable);
    return schedulableService.getScheduleItem(schedulable);
  }

  @FieldResolver(() => Date)
  async startTime(@Root() schedulable: Schedulable): Promise<Date> {
    const schedulableService: SchedulableService = this.getService(schedulable);
    return schedulableService.getStartTime(schedulable);
  }
}
