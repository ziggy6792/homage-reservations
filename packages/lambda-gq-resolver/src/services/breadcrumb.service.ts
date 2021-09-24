/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Event from 'src/domain/models/event';
import Context from 'src/typegraphql-setup/context';
import Container, { Service, Inject } from 'typedi';
import Link, { LinkType } from 'src/domain/objects/link';
import Competition from 'src/domain/models/competition';
import Round from 'src/domain/models/round';
import { EventService } from './event.service';
import { CompetitionService } from './competition.service';

// this service will be recreated for each request (scoped)
@Service()
export class BreadcrumbService {
  constructor(
    @Inject('context') private readonly context: Context,
    private readonly eventService: EventService,
    private readonly competitionService: CompetitionService
  ) {}

  getBreadcrumbsForEvent(event: Event): Link[] {
    const linkToEvent = new Link(LinkType.EVENT, event.name, event.id);
    return [linkToEvent];
  }

  async getBreadcrumbsForCompetition(compoetition: Competition): Promise<Link[]> {
    const linkToCompetition = new Link(LinkType.EVENT, compoetition.name, compoetition.id);
    const event = await this.eventService.getOne(compoetition.eventId);
    const eventBreadcrumbs = this.getBreadcrumbsForEvent(event);
    return [...eventBreadcrumbs, linkToCompetition];
  }

  async getBreadcrumbsForRound(round: Round): Promise<Link[]> {
    const linkToRound = new Link(LinkType.ROUND, round.name, round.id);
    const competition = await this.competitionService.getOne(round.competitionId);
    const competitionBreadcrumbs = await this.getBreadcrumbsForCompetition(competition);
    return [...competitionBreadcrumbs, linkToRound];
  }
}
