/* eslint-disable camelcase */
/* eslint-disable import/prefer-default-export */
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://graph.facebook.com/v11.0',
});

// APIGatewayProxyCallback, APIGatewayProxyEvent, Context

export interface Picture {
  height: number;
  is_silhouette: boolean;
  url: string;
  width: number;
}

export const getFacebookProfilePicture = async (accessToken: string): Promise<Picture> => {
  try {
    const options = {
      access_token: accessToken,
      fields: 'picture.width(800).height(800)',
    };
    const result = await axiosInstance.get('me', { params: options });
    return result.data?.picture.data;
  } catch (err) {
    console.error('ERROR FETCHING FACEBOOK PROFILE PICTURE', err);
    return null;
  }
};
