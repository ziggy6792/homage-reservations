import path from 'path';

/* eslint-disable import/prefer-default-export */
export const ENV = process.env.ENV || 'staging';
export const ROOT_DIR = path.join(__dirname, '../');
