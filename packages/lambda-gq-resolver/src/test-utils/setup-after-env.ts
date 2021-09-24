import 'reflect-metadata';
import * as envConfig from 'src/config/get-env-config';
import Container from 'typedi';
import Context from 'src/typegraphql-setup/context';
import { v4 as uuidv4 } from 'uuid';
import localAwsConfig from './config';
import { TEST_CONTEXT } from './tokens';

// Ignore what is set in config and force test env config
jest.spyOn(envConfig, 'default').mockReturnValue({
  env: envConfig.EnvType.TEST,
  awsConfig: localAwsConfig,
});

jest.setTimeout(300000);

Container.set({
  id: TEST_CONTEXT,
  transient: true, // create a fresh copy for each `get`
  factory: () => {
    const requestId = uuidv4();
    const container = Container.of(requestId); // get scoped container
    const context = new Context({ recieved: null, requestId, container });
    container.set('context', context);
    return context;
  },
});
