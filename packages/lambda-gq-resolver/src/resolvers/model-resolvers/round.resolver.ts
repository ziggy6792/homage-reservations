import { Service } from 'typedi';
import { Resolver, Query, FieldResolver, Root } from 'type-graphql';

import { Logger } from 'src/logger';
import Round from 'src/domain/models/round';
import { RoundService } from 'src/services/round.service';
import * as crud from 'src/crud-resolver-builders';
import { HeatService } from 'src/services/heat.service';
import { HeatList } from 'src/domain/objects/lists';
import Competition from 'src/domain/models/competition';
import { CompetitionService } from 'src/services/competition.service';
import { EventService } from 'src/services/event.service';
import Link, { LinkList, LinkType } from 'src/domain/objects/link';
import { buildCrudResolver, CrudCofig } from './crud-builder';

@Service()
@Resolver((of) => Round)
export class RoundResolver extends buildCrudResolver(
  new CrudCofig({ returnType: Round, suffix: 'Round', reolverBuilders: [new crud.Resolvers.GetOne(), new crud.Resolvers.GetMany()] })
)<Round> {
  constructor(
    private readonly roundService: RoundService,
    private readonly competitionService: CompetitionService,
    private readonly heatService: HeatService,
    private readonly eventService: EventService,
    private readonly logger: Logger
  ) {
    super({ service: roundService });
  }

  @FieldResolver(() => HeatList)
  async heats(@Root() round: Round): Promise<HeatList> {
    const list = new HeatList();
    list.items = await this.heatService.getHeatsByRoundId(round.id);
    return list;
  }

  @FieldResolver(() => Competition)
  async competition(@Root() round: Round): Promise<Competition> {
    return this.competitionService.getOne(round.competitionId);
  }

  @FieldResolver(() => Boolean)
  async isAdmin(@Root() round: Round): Promise<boolean> {
    const competition = await this.competitionService.getOne(round.competitionId);
    return this.eventService.getIsAdmin(competition.eventId);
  }

  @FieldResolver(() => Boolean)
  async isJudge(@Root() round: Round): Promise<boolean> {
    return this.competitionService.getIsJudge(round.competitionId);
  }

  @FieldResolver(() => String)
  async longName(@Root() round: Round): Promise<string> {
    const competition = await this.competitionService.getOne(round.competitionId);
    return `${competition.name} - ${round.getName()}`;
  }

  // ToDo use inheritance for this

  //   @Field(() => LinkList)
  // protected async breadcrumbs(): Promise<LinkList> {
  //   const list = new LinkList();
  //   list.items = await this.getBreadcrumbs();
  //   return list;
  // }

  // @Field(() => String, { name: 'longName' })
  // async getLongName(): Promise<string> {
  //   const competition = await this.getCompetition();
  //   return `${competition.name} - ${this.getName()}`;
  // }
}
