/* eslint-disable class-methods-use-this */
import { commonConfig } from '@alpaca-backend/common';
import _ from 'lodash';
import Creatable from 'src/domain/interfaces/creatable';
import Competition from 'src/domain/models/competition';
import Event from 'src/domain/models/event';
import EventRepository from 'src/repositories/event.respository';
import Context from 'src/typegraphql-setup/context';
import Container, { Inject, Service } from 'typedi';
import Link, { LinkType } from 'src/domain/objects/link';
import DataEntity from 'src/domain/interfaces/data-entity';
import ScheduleItem from 'src/domain/models/schedule-item';
import Schedule from 'src/domain/interfaces/schedule';
import { CompetitionService } from './competition.service';

import CreatableService from './creatable.service';
import { DataEntityService } from './data-entity.service';
import { HeatService, RoundService, ScheduleItemService } from '.';
import { ScheduleService } from './schedule.service';

// this service will be global - shared by every request
//
@Service()
@Service({ id: Event })
export class EventService extends CreatableService<Event> implements DataEntityService, ScheduleService {
  constructor(protected readonly repository: EventRepository) {
    super();
  }

  public async getIsAdmin(eventId: string): Promise<boolean> {
    const event = await this.getOne(eventId);
    return this.context.identity.user?.username === event.adminUserId;
  }

  public async getSelectedEvent(selectedHeatId: string): Promise<Event> {
    return this.repository.scan().whereAttribute('selectedHeatId').equals(selectedHeatId).execSingle();
  }

  public async getChildren(event: Event): Promise<Creatable[]> {
    const competitionService = this.context.getService(CompetitionService);
    return competitionService.getCompetitionsByEventId(event.id);
  }

  public async getEventByHeatId(heatId: string): Promise<Event> {
    const heatService = this.context.getService(HeatService);
    const roundService = this.context.getService(RoundService);
    const competitionService = this.context.getService(CompetitionService);
    const heat = await heatService.getOne(heatId);
    const round = await roundService.getOne(heat.roundId);
    const competition = await competitionService.getOne(round.competitionId);
    return this.getOne(competition.eventId);
  }

  async getBreadcrumbs(event: Event): Promise<Link[]> {
    const linkToEvent = new Link(LinkType.EVENT, event.name, event.id);
    return [linkToEvent];
  }

  async getScheduleItems(schedule: Schedule): Promise<ScheduleItem[]> {
    const competitionService = this.context.getService(CompetitionService);
    const scheduleItemService = this.context.getService(ScheduleItemService);
    const competitions = await competitionService.getCompetitionsByEventId(schedule.id);
    const sheduleIds = [schedule.id, ...competitions.map(({ id }) => id)];
    return scheduleItemService.getScheduleItemsByScheduleIds(sheduleIds);
  }

  async getLongName(event: Event): Promise<string> {
    return event.name;
  }
}
