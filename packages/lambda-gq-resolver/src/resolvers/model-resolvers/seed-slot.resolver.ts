/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
import { Service } from 'typedi';
import { Resolver, FieldResolver, Root } from 'type-graphql';

import Heat, { SeedSlot } from 'src/domain/models/heat';
import _ from 'lodash';
import { SeedSlotService } from 'src/services/seed-slot.service';
import { HeatService } from 'src/services/heat.service';

// this resolver will be recreated for each request (scoped)
@Service()
@Resolver((of) => SeedSlot)
export class SeedSlotReolver {
  constructor(private readonly seedSlotService: SeedSlotService, private readonly heatService: HeatService) {}

  @FieldResolver(() => Boolean)
  async isProgressing(@Root() seedSlot: SeedSlot): Promise<boolean> {
    return this.seedSlotService.getIsProgressing(seedSlot);
  }

  @FieldResolver(() => Heat, { nullable: true })
  async nextHeat(@Root() seedSlot: SeedSlot): Promise<Heat> {
    if (!seedSlot.nextHeatId) {
      return null;
    }
    return this.heatService.getOne(seedSlot.nextHeatId);
  }

  @FieldResolver(() => Heat, { nullable: true })
  async previousHeat(@Root() seedSlot: SeedSlot): Promise<Heat> {
    if (!seedSlot.previousHeatId) {
      return null;
    }
    return this.heatService.getOne(seedSlot.previousHeatId);
  }
}
