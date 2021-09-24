/* eslint-disable class-methods-use-this */
import { Resolver, Mutation, Arg } from 'type-graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { ENV } from 'src/config/conf';
import stream from 'stream';

import aws from 'aws-sdk';
import { commonUtils } from '@alpaca-backend/common';
import { Service } from 'typedi';

const s3 = new aws.S3({ endpoint: undefined, region: undefined });

@Service()
@Resolver()
export default class UploadFileResolver {
  @Mutation(() => Boolean)
  async uploadFile(
    @Arg('file', () => GraphQLUpload)
    upload: FileUpload
  ): Promise<boolean> {
    const { createReadStream, filename } = upload;

    console.log('bucket name', commonUtils.getS3BucketName(commonUtils.BucketName.FILE_UPLOADS, ENV));

    const uploadFromStream = () => {
      const pass = new stream.PassThrough();

      const params = {
        Key: `fileuploads/${new Date().getTime()}_${filename}`,
        Bucket: commonUtils.getS3BucketName(commonUtils.BucketName.FILE_UPLOADS, ENV),
        Body: pass,
      };
      s3.upload(params, (err, data) => {
        console.log(err, data);
      });

      return pass;
    };

    return new Promise((resolve, reject) =>
      createReadStream()
        .pipe(uploadFromStream())
        .on('finish', () => resolve(true))
        .on('error', () => reject(new Error('Error')))
    );
  }
}
