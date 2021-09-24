import GetMany from './resolver-builder-get-many';
import GetOne from './resolver-builder-get-one';
import UpdateOne from './resolver-builder-update-one';
import UpdateMany from './resolver-builder-update-many';
import CreateOne from './resolver-builder-create-one';
import CreateMany from './resolver-builder-create-many';
import DeleteOne from './resolver-builder-delete-one';

export { default as Builder } from './crud-builder';

export const Resolvers = { GetOne, GetMany, UpdateOne, UpdateMany, CreateOne, CreateMany, DeleteOne };

export * from './types';
