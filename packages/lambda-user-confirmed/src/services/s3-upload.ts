/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import axios from 'axios';

const axiousInstance = axios.create();

export const uploadSignedRequest = async (url: string, signedRequest: string): Promise<boolean> => {
  const input = (await axiousInstance({ url, responseType: 'arraybuffer' })).data as Buffer;

  const options = {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  };

  try {
    const response = await axiousInstance.put(signedRequest, input, options);

    console.log('uploadResponse', response);
  } catch (err) {
    console.log('uploadErr', err);
    throw err;
  }

  return true;
};
