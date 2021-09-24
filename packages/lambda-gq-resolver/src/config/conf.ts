/* eslint-disable import/prefer-default-export */
import path from 'path';

export const ROOT_DIR = path.join(__dirname, '../');
export const ENV = process.env.ENV || 'staging';
