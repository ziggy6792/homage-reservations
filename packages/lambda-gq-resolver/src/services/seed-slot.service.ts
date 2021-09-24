/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
import Heat, { SeedSlot } from 'src/domain/models/heat';
import { Inject, Service } from 'typedi';
import { RoundType } from 'src/domain/models/round';
import _ from 'lodash';
import Context from 'src/typegraphql-setup/context';
import { RoundService } from './round.service';
import { HeatService } from './heat.service';

// this service will be global - shared by every request
@Service()
@Service({ id: SeedSlot })
export class SeedSlotService {
  constructor(@Inject('context') protected readonly context: Context) {}

  async getIsProgressing(seedSlot: SeedSlot): Promise<boolean> {
    const roundService = this.context.getService(RoundService);
    const heatService = this.context.getService(HeatService);

    if (seedSlot.seed <= 3) {
      // First second third in whole competition is always proceeding
      return true;
    }
    if (!seedSlot.nextHeatId) {
      return false;
    }
    const nextHeat = await heatService.getOne(seedSlot.nextHeatId);
    const nextRound = await roundService.getOne(nextHeat.roundId);
    return nextRound?.type === RoundType.UPPER;
  }
}
