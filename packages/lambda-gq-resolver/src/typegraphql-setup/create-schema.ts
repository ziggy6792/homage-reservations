import 'reflect-metadata';
import { GraphQLSchema } from 'graphql';
import { buildSchemaSync, ResolverData } from 'type-graphql';
import BuildCompetition from 'src/resolvers/build-competition';
import SelectHeat from 'src/resolvers/select-heat';
import DeselectHeat from 'src/resolvers/deselect-heat';
import AllocateRiders from 'src/resolvers/allocate-riders';
import ScoreRun from 'src/resolvers/score-run';
import HelloResolver from 'src/resolvers/hello-world';
import EndHeatResolver from 'src/resolvers/end-heat';
import AddDemoRiders from 'src/resolvers/add-remove-demo-riders';
import SignUpCompetition from 'src/resolvers/sign-up-riders';
import ToggleCompetitionRegistration from 'src/resolvers/toggle-competition-registration';
import UploadFileResolver from 'src/resolvers/upload-file';
import { RecipeResolver } from 'src/recipe/recipe.resolver';
import { DataEntityResolver } from 'src/resolvers/interface-resolvers/data-entity.resolver';
import { SchedulableResolver } from 'src/resolvers/interface-resolvers/schedulable.resolver';
import { ScheduleItemResolver } from 'src/resolvers/interface-resolvers/schedule-item.resolver';
import { CompetitionResolver } from 'src/resolvers/model-resolvers/competition.resolver';
import { EventResolver } from 'src/resolvers/model-resolvers/event.resolver';
import { HeatResolver } from 'src/resolvers/model-resolvers/heat.resolver';
import { RiderAllocationResolver } from 'src/resolvers/model-resolvers/rider-allocation.resolver';
import { RiderRankResolver } from 'src/resolvers/model-resolvers/rider-rank.resolver';
import { RiderRegistrationResolver } from 'src/resolvers/model-resolvers/rider-registration.resolver';
import { RoundResolver } from 'src/resolvers/model-resolvers/round.resolver';
import { ScheduleResolver } from 'src/resolvers/model-resolvers/schedule.resolver';
import { SeedSlotReolver } from 'src/resolvers/model-resolvers/seed-slot.resolver';
import { UserResolver } from 'src/resolvers/model-resolvers/user.resolver';
import { IContext } from './context';

const createSchema = (): GraphQLSchema =>
  buildSchemaSync({
    resolvers: [
      // new crud
      RiderRegistrationResolver,
      HeatResolver,
      EventResolver,
      RoundResolver,
      UserResolver,
      CompetitionResolver,
      ScheduleItemResolver,
      DataEntityResolver,
      SchedulableResolver,
      ScheduleResolver,
      SeedSlotReolver,
      RiderAllocationResolver,
      RiderRankResolver,
      //
      BuildCompetition,
      AllocateRiders,
      AddDemoRiders,
      SignUpCompetition,
      ScoreRun,
      SelectHeat,
      DeselectHeat,
      EndHeatResolver,
      HelloResolver,
      ToggleCompetitionRegistration,
      UploadFileResolver,

      RecipeResolver,
    ] as any,
    dateScalarMode: 'isoDate',
    container: ({ context }: ResolverData<IContext>) => context.container,
  });

export default createSchema;
