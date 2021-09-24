import { IBackupConfig } from './types';

const envPlceholder = '[ENV]';

const backupBaseConfig: IBackupConfig = {
  readPercentage: 0.5,
  backupPath: '/test',
  bucket: 'alpaca-backend-backups',
  stopOnFailure: true,
  base64Binary: true,
  awsRegion: 'ap-southeast-1',
};

const backupCloudConfig: IBackupConfig = {
  ...backupBaseConfig,
};

const backupLocalConfig: IBackupConfig = {
  ...backupBaseConfig,
  awsRegion: 'local',
  endpoint: 'http://localhost:4566',
  httpOptions: {
    timeout: 3000,
  },
};

const tableNames = [
  `alpaca-backend-${envPlceholder}-Event`,
  `alpaca-backend-${envPlceholder}-Competition`,
  `alpaca-backend-${envPlceholder}-Heat`,
  `alpaca-backend-${envPlceholder}-RiderAllocation`,
  `alpaca-backend-${envPlceholder}-Round`,
  `alpaca-backend-${envPlceholder}-ScheduleItem`,
  `alpaca-backend-${envPlceholder}-User`,
  `alpaca-backend-${envPlceholder}-RiderRegistration`,
];

const config = {
  envPlceholder,
  tableNames,
  getBackupConfig: (isLocal: boolean, backupPath: string): IBackupConfig =>
    isLocal ? { ...backupLocalConfig, backupPath } : { ...backupCloudConfig, backupPath },
};

export default config;
