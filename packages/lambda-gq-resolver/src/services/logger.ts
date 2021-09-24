/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Context from 'src/typegraphql-setup/context';
import Container, { Service, Inject } from 'typedi';

// this service will be recreated for each request (scoped)
@Service()
export class Logger {
  constructor(@Inject('context') private readonly context: Context) {
    console.log('Logger created!');
    console.log((Container as any).instances);
  }

  log(...messages: any[]) {
    console.log(`(ID ${this.context.requestId}):`, ...messages);
  }
}
