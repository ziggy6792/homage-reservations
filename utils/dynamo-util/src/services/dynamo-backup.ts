/* eslint-disable no-await-in-loop */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import DynamoBackup from '@alpaca-backend/dynamo-backup-to-s3';
import promisePoller from 'promise-poller';
import log from 'src/log';
import { IBackupConfig } from 'src/types';

const DynamoRestore = DynamoBackup.Restore;

const backupTables = (tables: string[], backupConfig: IBackupConfig) => {
  const backup = new DynamoBackup({
    ...backupConfig,
    includedTables: tables,
  } as IBackupConfig);

  backup.on('error', (data) => {
    log(`Error backing up ${data.table}`);
    log(data.err);
  });

  backup.on('start-backup', (tableName, startTime) => {
    log(`Starting to copy table ${tableName}`);
  });

  backup.on('end-backup', (tableName, backupDuration) => {
    log(`Done copying table ${tableName}`);
  });

  return new Promise((resolve, reject) => {
    backup.backupAllTables(() => {
      log('Finished backing up DynamoDB');
      resolve('done');
    });
  });
};

const restoreTables = async (tables: { from: string; to: string }[], backupConfig: IBackupConfig) => {
  const restoreTable = (table: { from: string; to: string }) => {
    const restore = new DynamoRestore({
      source: `s3://${backupConfig.bucket}/${backupConfig.backupPath}/${table.from}.json`,
      table: table.to,
      overwrite: true,
      concurrency: 1, // for large restores use 1 unit per MB as a rule of thumb (ie 1000 for 1GB restore)
      awsRegion: backupConfig.awsRegion,
      endpoint: backupConfig.endpoint,
    });

    return new Promise((resolve, reject) => {
      restore.on('error', (message: string) => {
        log(message);
        reject(message);
      });
      restore.on('warning', (message: string) => {
        if (message.toLowerCase().includes('failed')) {
          log(`FAILED: ${table.to}`);
          log(message);
          reject(message);
        } else {
          log(message);
        }
      });

      restore.on('send-batch', (batches, requests, streamMeta) => {
        log('Batch sent. %d in flight. %d Mb remaining to download...', requests, streamMeta.RemainingLength / (1024 * 1024));
      });

      restore.run(() => {
        log('Finished restoring DynamoDB table');
        resolve('done');
      });
    });
  };

  const delay = (millis: number) => new Promise((resolve) => setTimeout(resolve, millis));

  for (let i = 0; i < tables.length; i++) {
    await promisePoller({
      taskFn: () => restoreTable(tables[i]),
      retries: 10,
      shouldContinue: (rejectionReason, resolvedValue) => {
        if (resolvedValue) {
          log(`SUCESSS: ${tables[i].to}`);
          return false;
        }
        return true;
      },
    });
    // console.log(`START ${tables[i].from}`);

    await restoreTable(tables[i]);
    // console.log(`DONE ${tables[i].from}`);
    await delay(500);
  }
};

const dynamoBackup = { backupTables, restoreTables };

export default dynamoBackup;
