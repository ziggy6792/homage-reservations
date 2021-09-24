import { IdentityType } from 'src/types';
import errorMessage from 'src/config/error-message';
import { IContext } from 'src/typegraphql-setup/context';
import { ScorRunInput } from 'src/inputs';
import { CompetitionService, HeatService, RoundService } from 'src/services';
import { AuthCheck } from './types';

const isHeatJudge = async (heatId: string, context: IContext) => {
  const heatService = context.getService(HeatService);
  const roundService = context.getService(RoundService);
  const competitionService = context.getService(CompetitionService);
  if (context.identity.type !== IdentityType.USER) {
    throw new Error(errorMessage.auth.authTypeNotUser);
  }
  const heat = await heatService.getOne(heatId);
  const round = await roundService.getOne(heat.roundId);
  if (await competitionService.getIsJudge(round.competitionId)) {
    return true;
  }

  throw new Error(errorMessage.auth.notCompetitionJudge);
};

export const isHeatInputJudge: AuthCheck = async ({ args, context }) => {
  const input = args.input as ScorRunInput;
  const { heatId } = input;
  return isHeatJudge(heatId, context);
};

export const isHeatIdJudge: AuthCheck = async ({ args, context }) => {
  const heatId = args.id as string;
  return isHeatJudge(heatId, context);
};
