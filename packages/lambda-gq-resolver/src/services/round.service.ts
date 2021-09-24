/* eslint-disable class-methods-use-this */
import { Service } from 'typedi';

import RoundRepository from 'src/repositories/round.respository';
import Round from 'src/domain/models/round';
import { commonConfig } from '@alpaca-backend/common';
import { attribute } from '@shiftcoders/dynamo-easy';
import Link, { LinkType } from 'src/domain/objects/link';
import Creatable from 'src/domain/interfaces/creatable';
import ScheduleItem from 'src/domain/models/schedule-item';
import Schedulable from 'src/domain/interfaces/schedulable';
import CreatableService from './creatable.service';
import { DataEntityService } from './data-entity.service';
import { CompetitionService } from './competition.service';
import { HeatService, ScheduleItemService } from '.';
import { SchedulableService } from './schedulable.service';

// this service will be global - shared by every request
@Service()
@Service({ id: Round })
export class RoundService extends CreatableService<Round> implements DataEntityService, SchedulableService {
  constructor(protected readonly repository: RoundRepository) {
    super();
  }

  public async getRoundsByCompetitionId(competitionId: string, filter?: Partial<Round>): Promise<Round[]> {
    const request = this.repository.query().index(commonConfig.DB_SCHEMA.Round.indexes.byCompetition.indexName).wherePartitionKey(competitionId);
    const attFilter = filter ? Object.keys(filter).map((key) => attribute(key).equals(filter[key])) : [];
    return attFilter.length > 0 ? request.where(...attFilter).execFetchAll() : request.execFetchAll();
  }

  // SchedulableService Override
  async getScheduleItem(schedulable: Schedulable): Promise<ScheduleItem> {
    const scheduleItemService = this.context.getService(ScheduleItemService);
    return scheduleItemService.getScheduleItemBySchedulableId(schedulable.id);
  }

  // SchedulableService Override
  async getStartTime(schedulable: Schedulable): Promise<Date> {
    const scheduleItemService = this.context.getService(ScheduleItemService);
    const scheduleItem = await scheduleItemService.getScheduleItemBySchedulableId(schedulable.id);
    return scheduleItem.startTime;
  }

  // DataEntityService Override
  async getBreadcrumbs(round: Round): Promise<Link[]> {
    const linkToRound = new Link(LinkType.ROUND, round.getName(), round.id);
    const competitionService = this.context.container.get(CompetitionService);
    const event = await competitionService.getOne(round.competitionId);
    const competitionBreadcrumbs = await competitionService.getBreadcrumbs(event);
    return [...competitionBreadcrumbs, linkToRound];
  }

  // DataEntityService Override
  async getLongName(round: Round): Promise<string> {
    const competitionService = this.context.container.get(CompetitionService);
    const competition = await competitionService.getOne(round.competitionId);
    return `${competition.name} - ${round.getName()}`;
  }

  public async getChildren(round: Round): Promise<Creatable[]> {
    const heatService = this.context.getService(HeatService);
    return heatService.getHeatsByRoundId(round.id);
  }
}
