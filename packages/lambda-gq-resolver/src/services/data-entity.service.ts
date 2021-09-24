/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Link from 'src/domain/objects/link';
import DataEntity from 'src/domain/interfaces/data-entity';

// this service will be recreated for each request (scoped)
export interface DataEntityService {
  getBreadcrumbs(dataEntity: DataEntity): Promise<Link[]>;
  getLongName(dataEntity: DataEntity): Promise<string>;
}
