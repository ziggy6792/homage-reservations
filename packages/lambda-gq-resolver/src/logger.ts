/* eslint-disable no-useless-constructor */
import Container, { Service, Inject } from 'typedi';
import Context from './typegraphql-setup/context';

// this service will be recreated for each request (scoped)
@Service()
export class Logger {
  constructor(@Inject('context') private readonly context: Context) {
    // console.log('Logger created!!');
    // console.log((Container as any).instances);
  }

  log(...messages: any[]) {
    console.log(`(ID ${this.context.requestId}):`, ...messages);
  }
}
