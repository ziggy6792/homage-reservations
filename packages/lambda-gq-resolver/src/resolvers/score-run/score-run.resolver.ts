/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */

import { Resolver, Mutation, Arg, UseMiddleware, Ctx } from 'type-graphql';
import _ from 'lodash';
import Heat, { HeatStatus } from 'src/domain/models/heat';
import { ScorRunInput } from 'src/inputs/score-run.inputs';
import RiderAllocation from 'src/domain/models/rider-allocation';
import errorMessage from 'src/config/error-message';
import createAuthMiddleware from 'src/middleware/create-auth-middleware';
import { isHeatInputJudge } from 'src/middleware/auth-check/is-heat-judge';
import { mapDbException } from 'src/utils/utility';
import { IContext } from 'src/typegraphql-setup/context';
import { Service } from 'typedi';
import { BatchCreatableService, EventService, HeatService, RiderAllocationService } from 'src/services';

@Service()
@Resolver()
export default class ScoreRun {
  constructor(
    private readonly eventService: EventService,
    private readonly riderAllocationService: RiderAllocationService,
    private readonly batchCreatableService: BatchCreatableService,
    private readonly heatService: HeatService
  ) {}

  @Mutation(() => Heat)
  @UseMiddleware([createAuthMiddleware([isHeatInputJudge])])
  async scoreRun(@Arg('input', () => ScorRunInput) input: ScorRunInput): Promise<Heat> {
    const { heatId, ...rest } = input;

    const riderAllocationUpdateParams = {
      heatId,
      ...rest,
    };

    const heat = await this.heatService.getOne(input.heatId);

    // const heatStatus = await heat.getStatus(ctx);
    const heatStatus = await this.heatService.getStatus(heat);

    if (heatStatus !== HeatStatus.SELECTED_IN_PROGRESS) {
      throw new Error(errorMessage.heatNotOpen);
    }

    try {
      // await RiderAllocation.store.updateItem(riderAllocationUpdateParams).exec();
      await this.riderAllocationService.updateOne(riderAllocationUpdateParams);
    } catch (err) {
      throw mapDbException(err, errorMessage.canNotFindRider);
    }

    return heat;
  }
}
