import getEnvConfig from 'src/config/get-env-config';
import { commonUtils } from '@alpaca-backend/common';
import { CreatableClassType } from 'src/types';
import Creatable from 'src/domain/interfaces/creatable';
import CreatableService from 'src/services/creatable.service';

const envConig = getEnvConfig();

export const VALUE = {
  NULL: 'NULL',
};

export const valueIsNull = (value: any): boolean => value === null || value === undefined || value === VALUE.NULL;

export const getTableName = (tableName: string): string => {
  const ret = commonUtils.getTableName(tableName, envConig.env);
  return ret;
};

export const mapDbException = (err: any, message: string): Error => {
  if (err?.code === 'ConditionalCheckFailedException') {
    return new Error(message);
  }
  return err;
};

export const multitableGet = async (
  possibleTypes: CreatableClassType[],
  getFunction: (createable: CreatableClassType) => Promise<Creatable>
): Promise<Creatable> => {
  const results = await Promise.allSettled(possibleTypes.map((entity) => getFunction(entity)));
  const fullfilledResults = results.filter((res) => res.status === 'fulfilled');
  if (fullfilledResults.length > 0 && fullfilledResults[0].status === 'fulfilled') {
    return fullfilledResults[0].value;
  }
  return null;
};

export const multiServiceGet = async (services: CreatableService<any>[], partitionKey: string, sortKey?: string): Promise<Creatable> => {
  const results = await Promise.allSettled(services.map((service) => service.getOne(partitionKey, sortKey)));
  const fullfilledResults = results.filter((res) => res.status === 'fulfilled');
  if (fullfilledResults.length > 0 && fullfilledResults[0].status === 'fulfilled') {
    return fullfilledResults[0].value;
  }
  return null;
};
