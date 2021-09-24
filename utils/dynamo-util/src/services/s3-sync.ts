import * as child from 'child_process';
import config from 'src/config';
import AWS from 'aws-sdk';
import log from 'src/log';

interface ISpawnAndWaitProps {
  log?: (any) => void;
  waitUntilOutputIncludes?: string;
}

const spawnAndWait = (
  command: string,
  args: string[],
  { log, waitUntilOutputIncludes }: ISpawnAndWaitProps = { log: console.log, waitUntilOutputIncludes: null }
): Promise<void> => {
  const outputFound = (data: any) => waitUntilOutputIncludes && data.toString().includes(waitUntilOutputIncludes);

  return new Promise((resolve, reject) => {
    const spawn = child.spawn(command, args);

    spawn.stdout.on('data', (data) => {
      log(data.toString());
      if (outputFound(data)) {
        resolve();
      }
    });

    spawn.stderr.on('data', (data) => {
      log(data.toString());

      if (outputFound(data)) {
        resolve();
      }
    });

    spawn.on('exit', (code) => {
      log(`child process exited with code ${code?.toString()}`);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`child process exited with code ${code?.toString()}`));
      }
    });
  });
};

const download = async (backupPath: string): Promise<void> => {
  const localBackupConfig = config.getBackupConfig(true, backupPath);

  const downloadPath = `${__dirname}/s3-downloads/${backupPath}`;

  const s3Path = `s3://${localBackupConfig.bucket}/${backupPath}/`;

  const localS3Client = new AWS.S3({
    endpoint: localBackupConfig.endpoint,
    s3ForcePathStyle: true,
  });

  // Create bucket if it doesn't exist
  try {
    await localS3Client.createBucket({ Bucket: localBackupConfig.bucket }).promise();
  } catch (err) {
    // Do nothing
  }

  await spawnAndWait('aws', `s3 sync ${s3Path} ${downloadPath}`.split(' '), { log });
  await spawnAndWait('aws', `s3 sync --endpoint-url=${localBackupConfig.endpoint} ${downloadPath} ${s3Path}`.split(' '), { log });
};

const upload = async (backupPath: string): Promise<void> => {
  const localBackupConfig = config.getBackupConfig(true, backupPath);

  const downloadPath = `${__dirname}/s3-downloads/${backupPath}`;

  const s3Path = `s3://${localBackupConfig.bucket}/${backupPath}/`;

  const localS3Client = new AWS.S3({
    s3ForcePathStyle: true,
  });

  // Create bucket if it doesn't exist
  try {
    await localS3Client.createBucket({ Bucket: localBackupConfig.bucket }).promise();
  } catch (err) {
    // Do nothing
  }

  await spawnAndWait('aws', `s3 sync --endpoint-url=${localBackupConfig.endpoint} ${s3Path} ${downloadPath}`.split(' '), { log });
  await spawnAndWait('aws', `s3 sync ${downloadPath} ${s3Path}`.split(' '), { log });
};

const s3Sync = { download, upload };

export default s3Sync;
