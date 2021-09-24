/* eslint-disable class-methods-use-this */

import _ from 'lodash';
import { IdentityType } from 'src/types';
import errorMessage from 'src/config/error-message';
import { CompetitionService, EventService } from 'src/services';
import { AuthCheck } from './types';

const isCompetitionAdmin: AuthCheck = async ({ args, context }) => {
  const competitionService = context.getService(CompetitionService);
  const eventService = context.getService(EventService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const competitionId = args.id as string;
  const competition = await competitionService.getOne(competitionId);
  const event = await eventService.getOne(competition.eventId);
  if (event.adminUserId === context.identity.user?.username) {
    return true;
  }
  throw new Error(errorMessage.auth.notCompetitionAdmin);
};

export default isCompetitionAdmin;
