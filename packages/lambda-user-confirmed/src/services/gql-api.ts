import gql from 'graphql-tag';
import { apolloClient } from 'src/utils/apollo-client';

const REGISTER = gql`
  mutation createUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      profilePicture {
        putUrl
      }
    }
  }
`;

const UPDATE_USER = gql`
  mutation updateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      profilePicture {
        putUrl
      }
    }
  }
`;

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const registerUser = async (user: IUser): Promise<any> => {
  console.log('user', user);
  try {
    // const response = await client.query({ query: HELLO });
    const response = await apolloClient.mutate({
      mutation: REGISTER,
      variables: {
        input: user,
      },
    });
    return response.data.createUser;
  } catch (err) {
    console.log('ERROR');

    console.log({ err });
    return false;
  }
};

export const updateUser = async (user: IUser): Promise<any> => {
  try {
    // const response = await client.query({ query: HELLO });
    const response = await apolloClient.mutate({
      mutation: UPDATE_USER,
      variables: {
        input: user,
      },
    });
    return response.data.updateUser;
  } catch (err) {
    console.log('ERROR');

    console.log({ err });
    return false;
  }
};
