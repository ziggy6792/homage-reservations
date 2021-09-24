import _ from 'lodash';

// Users
const fbUser = {
  __typename: 'User',
  createdAt: '2021-06-16T13:22:39.973Z',
  email: 'ziggy067@googlemail.com',
  firstName: 'Simon',
  fullNameHash: 'VERHOEVEN_SIMON',
  id: 'Facebook_10224795420532374',
  lastName: 'Verhoeven',
  modifiedAt: '2021-06-16T13:22:39.973Z',
  profilePicture: {
    width: 159,
    height: 159,
    s3Object: { bucket: 'alpaca-backend-public-assets-staging', key: 'profile-pictures/Facebook_100247812311264.jpeg' },
  },
  signUpAttributes: {
    'cognito:user_status': 'EXTERNAL_PROVIDER',
    email: 'ziggy067@googlemail.com',
    email_verified: 'false',
    family_name: 'Verhoeven',
    given_name: 'Simon',
    identities: '[{"userId":"10224795420532374","providerName":"Facebook","providerType":"Facebook","issuer":null,"primary":true,"dateCreated":1623849756454}]',
    picture:
      '{"data":{"height":640,"is_silhouette":false,"url":"https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=10224795420532374&height=800&width=800&ext=1626508222&hash=AeQq2Iyt4dKNtFUtJcs","width":640}}',
    sub: 'f666a923-f818-45fd-8409-475e7cc2e386',
  },
};

const adminUser = {
  __typeName: 'User',
  createdAt: '2021-02-27T08:06:46.074Z',
  email: 'ziggy067+1@gmail.com',
  firstName: 'Simon',
  id: 'babbbafe-f229-4a30-9dd4-b1bc55b4ed9a',
  lastName: 'Verhoeven Admin',
  modifiedAt: '2021-03-15T02:04:42.868Z',
};

const judgeUser = {
  __typeName: 'User',
  createdAt: '2021-03-15T02:04:42.868Z',
  email: 'ziggy067+2@gmail.com',
  firstName: 'Simon',
  id: 'ed467afb-161b-4cdc-9e71-dad3d0be9bda',
  lastName: 'Verhoeven Judge',
  modifiedAt: '2021-03-15T02:04:42.868Z',
};

const plebUser = {
  __typeName: 'User',
  createdAt: '2021-03-15T02:04:42.868Z',
  email: 'ziggy067+2@gmail.com',
  firstName: 'Simon',
  id: '723b1d64-bdb8-4fff-a50a-b48cdb1bee01',
  lastName: 'Verhoeven Pleb',
  modifiedAt: '2021-03-15T02:04:42.868Z',
};

export const cognitoUsers = { adminUser, judgeUser, plebUser, fbUser };

export const dbOnlyUsers = _.range(0, 25).map((index) => {
  const riderLetter = String.fromCharCode(index + 65);
  const id = `rider${riderLetter}`;
  return {
    __typeName: 'User',
    createdAt: '2021-03-15T02:04:42.868Z',
    isDbOnlyUser: true,
    email: `${id}@gmail.com`,
    firstName: 'rider',
    id,
    lastName: riderLetter,
    modifiedAt: '2021-03-15T02:04:42.868Z',
  };
});
