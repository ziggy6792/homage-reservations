export interface IBackupConfig {
  readPercentage: number;
  includedTables?: string[];
  exclusiveTables?: string[];
  backupPath: string;
  bucket: string;
  stopOnFailure: boolean;
  base64Binary: boolean;
  awsRegion: string;
  endpoint?: string;
  debug?: boolean;
  httpOptions?: {
    timeout: number;
  };
}
