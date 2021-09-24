/* eslint-disable no-useless-constructor */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */

import { Resolver, Mutation, Arg, ID, UseMiddleware } from 'type-graphql';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import Competition from 'src/domain/models/competition';
import isCompetitionAdmin from 'src/middleware/auth-check/is-comp-admin';
import { Service } from 'typedi';
import { CompetitionService } from 'src/services';

@Service()
@Resolver()
export default class ToggleCompetitionRegistration {
  constructor(private readonly competitionService: CompetitionService) {}

  @Mutation(() => Competition, { nullable: true })
  @UseMiddleware([createAuthMiddleware([isCompetitionAdmin])])
  async toggleCompetitionRegistraion(@Arg('id', () => ID) id: string): Promise<Competition> {
    const competition = await this.competitionService.getOne(id);
    competition.isRegistrationClosed = !competition.isRegistrationClosed;
    return this.competitionService.updateOne(competition);
  }
}
