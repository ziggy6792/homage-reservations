/* eslint-disable import/prefer-default-export */
import { ExecutionResult, graphql } from 'graphql';
import { Maybe } from 'graphql/jsutils/Maybe';
import createSchema from 'src/typegraphql-setup/create-schema';
import Context from 'src/typegraphql-setup/context';
import { v4 as uuidv4 } from 'uuid';
import Container from 'typedi';
import { TEST_CONTEXT } from './tokens';

interface IOptions {
  source: string;
  variableValues?: Maybe<{ [key: string]: any }>;
}

const schema = createSchema();

export const gCall = async ({ source, variableValues }: IOptions): Promise<ExecutionResult> => {
  // const requestId = uuidv4();
  // const container = Container.of(requestId); // get scoped container
  // const context = new Context({ recieved: null, requestId, container });
  // container.set('context', context); // place context or other data in container
  const testContext = Container.get(TEST_CONTEXT);

  const response = await graphql({
    schema,
    source,
    variableValues,
    contextValue: testContext,
  });
  if (response?.errors) {
    throw new Error(JSON.stringify(response.errors));
  }
  return response;
};

// export const gCall = async ({ source, variableValues }: IOptions): Promise<{ data?: any }> => {
//   const response = await axios.post('http://localhost:3100/lambda-gq-resolver/auth-none/graphql', { query: source, variables: variableValues });
//   if (response.data.errors) {
//     throw new Error(JSON.stringify(response.data.errors));
//   }
//   return response.data;
// };
