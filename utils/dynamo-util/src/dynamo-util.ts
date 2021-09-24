/* eslint-disable no-await-in-loop */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import config from './config';
import log from './log';
import s3Sync from './services/s3-sync';
import dynamoBackup from './services/dynamo-backup';

enum ValidCommands {
  COPY_TABLES = 'copy-tables',
  SNAPSHOT = 'snapshot',
  RESTORE = 'restore',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
}
interface IArgs {
  _?: string[];
}

interface ICopyArgs extends IArgs {
  fromEnv: string;
  fromIsLocal?: boolean;
  toEnv: string;
  toIsLocal?: boolean;
}

interface ISnapshotArgs extends IArgs {
  fromEnv: string;
  toSnapshot?: string;
  isLocal?: boolean;
}

interface IRestoreArgs extends IArgs {
  fromSnapshot: string;
  fromEnv?: string;
  toEnv?: string;
  isLocal?: boolean;
}

interface IUploadDownloadArgs extends IArgs {
  snapshot: string;
}

const main = async (): Promise<void> => {
  const args = (yargs(hideBin(process.argv)).argv as unknown) as IArgs;

  log('Recieved Args', args);

  const command = args?._.length && args._[0];

  log('Recieved Command', command);

  switch (command) {
    case ValidCommands.COPY_TABLES:
      await copyTables(args as ICopyArgs);
      return;
    case ValidCommands.SNAPSHOT:
      await snapshot(args as ISnapshotArgs);
      return;
    case ValidCommands.RESTORE:
      await restore(args as IRestoreArgs);
      return;
    case ValidCommands.DOWNLOAD:
      await download(args as IUploadDownloadArgs);
      return;
    case ValidCommands.UPLOAD:
      await upload(args as IUploadDownloadArgs);
      return;
    default:
      log('Command not valid', command);
      throw new Error(`Command not valid: ${command}`);
  }
};

const getSnapshotName = (env: string) => `${env}_${new Date().getTime()}`;

const copyTables = async (args: ICopyArgs) => {
  log(`Copying tables from ${args.fromEnv} to ${args.toEnv}`);

  const backupPath = getSnapshotName(args.fromEnv);

  await snapshot({ fromEnv: args.fromEnv, toSnapshot: backupPath, isLocal: args.fromIsLocal });

  if (!args.fromIsLocal && args.toIsLocal) {
    await download({ snapshot: backupPath });
  }

  if (args.fromIsLocal && !args.toIsLocal) {
    await upload({ snapshot: backupPath });
  }

  await restore({ fromSnapshot: backupPath, toEnv: args.toEnv, isLocal: args.toIsLocal });
};

const snapshot = async (args: ISnapshotArgs) => {
  if (!args.fromEnv) {
    throw new Error('Invalid Args');
  }

  const backupPath = args.toSnapshot || getSnapshotName(args.fromEnv);

  log(`Snapshotting "${args.fromEnv}" to "${backupPath}"`);

  const tables = config.tableNames.map((tableName) => tableName.replace(config.envPlceholder, args.fromEnv));

  // Copy to s3
  await dynamoBackup.backupTables(tables, config.getBackupConfig(args.isLocal, backupPath));
};

const restore = async (args: IRestoreArgs) => {
  // eslint-disable-next-line prefer-destructuring
  args.fromEnv = args.fromEnv || args.fromSnapshot.split('_')[0];
  args.toEnv = args.toEnv || args.fromSnapshot.split('_')[0];

  if (!args.fromEnv) {
    throw new Error('Invalid Args fromEnv missing');
  }

  if (args.toEnv === 'prod') {
    throw new Error('Are you fucking mad!?');
  }

  const backupPath = args.fromSnapshot || args.fromEnv;

  log(`Copying snapshot "${backupPath}" to "${args.toEnv}"`);

  const copyTables = config.tableNames.map((tableName) => ({
    from: tableName.replace(config.envPlceholder, args.fromEnv),
    to: tableName.replace(config.envPlceholder, args.toEnv),
  }));

  // Copy from s3
  await dynamoBackup.restoreTables(copyTables, config.getBackupConfig(args.isLocal, backupPath));
};

const download = async (args: IUploadDownloadArgs) => {
  if (!args.snapshot) {
    throw new Error('Invalid Args snapshot missing');
  }
  await s3Sync.download(args.snapshot);
};

const upload = async (args: IUploadDownloadArgs) => {
  if (!args.snapshot) {
    throw new Error('Invalid Args snapshot missing');
  }
  await s3Sync.upload(args.snapshot);
};

export default main;
