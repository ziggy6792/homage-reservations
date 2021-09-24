/* eslint-disable class-methods-use-this */
/* eslint-disable no-useless-constructor */
import { Inject, Service } from 'typedi';
import { Resolver, FieldResolver, Root, Query, Arg, ID } from 'type-graphql';
import { Logger } from 'src/logger';
import DataEntity from 'src/domain/interfaces/data-entity';
import { LinkList } from 'src/domain/objects/link';
import { BreadcrumbService } from 'src/services/breadcrumb.service';
import { DataEntityService } from 'src/services/data-entity.service';
import { EventService } from 'src/services/event.service';
import { CompetitionService } from 'src/services/competition.service';
import { RoundService } from 'src/services/round.service';
import { HeatService } from 'src/services/heat.service';
import Context from 'src/typegraphql-setup/context';
import { CreatableClassType } from 'src/types';
import * as utils from 'src/utils/utility';

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver(() => DataEntity)
export class DataEntityResolver {
  constructor(
    @Inject('context') private readonly context: Context,

    private readonly eventService: EventService,
    private readonly competitionService: CompetitionService,
    private readonly heatService: HeatService
  ) {}

  getService(dataEntity: DataEntity): DataEntityService {
    return this.context.getServiceForModel(dataEntity.constructor as CreatableClassType);
    // switch (dataEntity.constructor) {
    //   case Event:
    //     return this.eventService;
    //     break;
    //   case Competition:
    //     return this.competitionService;
    //     break;
    //   case Round:
    //     return this.roundService;
    //     break;
    //   case Heat:
    //     return this.heatService;
    //     break;
    //   default:
    //     return null;
    // }
  }

  @FieldResolver(() => LinkList)
  async breadcrumbs(@Root() dataEntity: DataEntity): Promise<LinkList> {
    const list = new LinkList();
    const dataEntityService: DataEntityService = this.getService(dataEntity);
    list.items = await dataEntityService.getBreadcrumbs(dataEntity);
    return list;
  }

  @FieldResolver(() => String)
  async longName(@Root() dataEntity: DataEntity): Promise<string> {
    const dataEntityService: DataEntityService = this.getService(dataEntity);
    return dataEntityService.getLongName(dataEntity);
  }

  @Query(() => DataEntity, { nullable: true })
  async getDataEntity(@Arg('id', () => ID) id: string): Promise<DataEntity> {
    return utils.multiServiceGet([this.eventService, this.competitionService, this.heatService], id) as Promise<DataEntity>;
  }
}
