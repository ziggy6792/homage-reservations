/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */

import { IAttributeType, ITableSchema, IGlobalSecondaryIndex, ITableSchemaBase } from './types';

const idPartitionKey = { name: 'id', type: IAttributeType.STRING };

export const createTableSchema = <T extends Partial<ITableSchema>>(tableSchema: T = {} as T): ITableSchemaBase & T =>
  ({
    tableName: tableSchema.tableName,
    partitionKey: tableSchema.partitionKey || idPartitionKey,
    sortKey: tableSchema.sortKey,
    indexes: tableSchema.indexes,
    skipDeployment: tableSchema.skipDeployment,
  } as ITableSchemaBase & T);

export const createGSI = (indexProps: IGlobalSecondaryIndex): IGlobalSecondaryIndex => ({
  indexName: indexProps.indexName,
  partitionKey: indexProps.partitionKey,
  sortKey: indexProps.sortKey,
});

// type IDbSchema = {
//     readonly [tableKey in keyof typeof DB_SCHEMA_CONFIG]: typeof DB_SCHEMA_CONFIG[tableKey] & ITableSchema;
// };

// type IDbSchema = {
//     readonly [tableKey in keyof typeof DB_SCHEMA_CONFIG]: {
//         [indexKey in keyof typeof DB_SCHEMA_CONFIG[tableKey]]: typeof DB_SCHEMA_CONFIG[tableKey][indexKey] & {
//             indexName: string;
//         };
//     } & {
//         tableName: string;
//     };
// };

// type IDbSchema = { readonly [key in keyof typeof DB_SCHEMA_CONFIG]: ITableSchema };

// type IDbSchema = {
//     readonly [tableKey in keyof typeof DB_SCHEMA_CONFIG]: typeof DB_SCHEMA_CONFIG[tableKey] & {
//         tableName: string;
//     };
// };

// type IDbSchema = {
//     readonly [tableKey in keyof typeof DB_SCHEMA_CONFIG]: {
//         [indexKey in keyof typeof DB_SCHEMA_CONFIG[tableKey].indexes]: typeof DB_SCHEMA_CONFIG[tableKey].indexes]
//     } & {
//         tableName: string;
//     };
// };

// type IDbSchema2 = {
//     readonly [tableKey in keyof typeof DB_SCHEMA_CONFIG]: ITableSchema & { [indexKey in keyof typeof DB_SCHEMA_CONFIG[tableKey]]: IGlobalSecondaryIndex };
// };

export const applyDefaults = <T>(schema: T): T => {
  const recievedSchema = (schema as unknown) as ITableSchema;

  const ret: any = {};

  for (const [key, tableSchema] of Object.entries(recievedSchema)) {
    if (tableSchema.indexes) {
      for (const key of Object.keys(tableSchema.indexes)) {
        const gsi = tableSchema.indexes[key];
        gsi.indexName = gsi.indexName || key;
      }
    }

    ret[key] = {
      ...tableSchema,
      tableName: tableSchema.tableName || key,
      partitionKey: tableSchema.partitionKey,
    };
  }
  return ret as T;
};
