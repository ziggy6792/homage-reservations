// ToDo : delete this

import Creatable from 'src/domain/interfaces/creatable';
import CreatableService from 'src/services/creatable.service';
import Context from 'src/typegraphql-setup/context';
import { Inject } from 'typedi';

interface ICrudProps<T extends Creatable> {
  service: CreatableService<T>;
}

export abstract class CreatableResolver<T extends Creatable> {
  protected props: ICrudProps<T>;

  @Inject('context') protected readonly context: Context;

  constructor(props: ICrudProps<T>) {
    this.props = props;
  }
}
