/* eslint-disable no-restricted-imports */
/* eslint-disable import/prefer-default-export */
import config from 'src/config';
import { LambdaConfig, FrontendConfig } from './ssm-param-util';

const getTableName = (tableName: string, stage: string): string => {
  const contItems = [config.PROJECT_NAME, stage, tableName].filter((v) => v != null);
  return contItems.join('-');
};

enum BucketName {
  'FILE_UPLOADS' = 'file-uploads',
}

const getS3BucketName = (bucketName: BucketName, stage: string): string => {
  const contItems = [config.PROJECT_NAME, stage, bucketName].filter((v) => v != null);
  return contItems.join('-');
};

// export const getSsmParam = <T = any>(paramPath: SsmParam, stage: string): SSMParamUtil<T> => new SSMParamUtil<T>(paramPath, stage);

export default { getTableName, getS3BucketName, BucketName, LambdaConfig, FrontendConfig };
