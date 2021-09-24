/* eslint-disable no-useless-constructor */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */

import { Resolver, ID, Mutation, Arg, UseMiddleware } from 'type-graphql';
import Event from 'src/domain/models/event';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { isHeatIdJudge } from 'src/middleware/auth-check/is-heat-judge';
import ValidationItemList from 'src/domain/objects/validation/validation-item-list';
import { Service } from 'typedi';
import { CompetitionService, RiderRegistrationService, BatchCreatableService, EventService } from 'src/services';

@Service()
@Resolver()
export default class SelectHeatResolver {
  constructor(private readonly eventService: EventService) {}

  @Mutation(() => Event, { nullable: true })
  @UseMiddleware([createAuthMiddleware([isHeatIdJudge])])
  async deselectHeat(@Arg('id', () => ID) heatId: string): Promise<Event | ValidationItemList> {
    const eventWithMeSelected = await this.eventService.getSelectedEvent(heatId);

    if (!eventWithMeSelected) {
      throw new Error('The heat you are trying to deselect is not selected');
    }

    // Clear selected heat
    eventWithMeSelected.selectedHeatId = null;

    return this.eventService.updateOne(eventWithMeSelected);
  }
}
