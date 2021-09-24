/* eslint-disable import/prefer-default-export */
/* eslint-disable no-useless-constructor */

import { ResolverBuilder, ResolverType } from './resolver-builder';

interface ICrudResolverPross {
  resolverBuilders: ResolverBuilder[];
}

export default class CrudBuilder {
  props: ICrudResolverPross;

  constructor(props: ICrudResolverPross) {
    this.props = props;
  }
}
