import 'reflect-metadata';
import AWS from 'aws-sdk';
import { ApolloServer } from 'apollo-server-express';
import * as serverless from 'aws-serverless-express';
import express from 'express';
import cors from 'cors';
import { graphqlUploadExpress } from 'graphql-upload';
import { Server } from 'node:http';
import Container, { ContainerInstance } from 'typedi';
import { GraphQLRequestContext } from 'apollo-server-plugin-base';
import { v4 as uuidv4 } from 'uuid';
import createSchema from './typegraphql-setup/create-schema';
import Context, { IContext } from './typegraphql-setup/context';
import getEnvConfig from './config/get-env-config';
import { setSamplesInContainer } from './recipe/recipe-samples';

const { awsConfig } = getEnvConfig();

const createApolloServer = (): ApolloServer => {
  setSamplesInContainer();
  console.log('createApolloServer');
  return new ApolloServer({
    schema: createSchema(),
    introspection: true,
    context: async (recieved: any): Promise<IContext> => {
      const requestId = uuidv4();
      const container = Container.of(requestId); // get scoped container
      const context = new Context({ recieved, requestId, container });
      container.set('context', context);
      return context;
    },
    plugins: [
      {
        requestDidStart: async (requestContext: GraphQLRequestContext<Context>) => {
          // remember to dispose the scoped container to prevent memory leaks
          Container.reset(requestContext.context.requestId.toString());
          // for developers curiosity purpose, here is the logging of current scoped container instances
          // we can make multiple parallel requests to see in console how this works
          const instancesIds = ((Container as any).instances as ContainerInstance[]).map((instance) => instance.id);
          console.log('instances left in memory:', instancesIds);
        },
      },
    ],
  });
};

const addGqlMiddleware = (app: express.Express) => {
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));
};

// Init
AWS.config.update(awsConfig);

let server: Server;
const startServer = async () => {
  const app = express();
  addGqlMiddleware(app);
  app.use(cors({ allowedHeaders: '*', origin: '*', methods: '*' }));
  const apolloServer = createApolloServer();
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '*' });
  return serverless.createServer(app);
};

const handler = async (event, context, callback) => {
  const logText = `
  partialConnection.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '${process.env.AWS_ACCESS_KEY_ID}';
  partialConnection.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '${process.env.AWS_SECRET_ACCESS_KEY}';
  partialConnection.AWS_SESSION_TOKEN =
    process.env.AWS_SESSION_TOKEN ||
    // eslint-disable-next-line max-len
    '${process.env.AWS_SESSION_TOKEN}' `;

  console.log(logText);

  console.log('handler event', JSON.stringify(event));

  server = server || (await startServer());

  try {
    // return serverless.proxy(server, event, context);
    return await serverless.proxy(server, event, context, 'PROMISE').promise;
  } catch (err) {
    console.log('error', err);
    callback(err);
    return err;
  }
};

export { createApolloServer, handler, addGqlMiddleware };
