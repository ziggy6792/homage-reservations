/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */
import { Length, IsEmail } from 'class-validator';
import { Field, InputType, ID, Int } from 'type-graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

import { commonUtils } from '@alpaca-backend/common';
import { ENV } from 'src/config/conf';

@InputType()
export class S3ObjectInput {
  @Field(() => String, { nullable: true, defaultValue: commonUtils.getS3BucketName(commonUtils.BucketName.FILE_UPLOADS, ENV) })
  bucket: string;

  @Field(() => String)
  key: string;
}

@InputType()
class PictureInput {
  @Field(() => Int, { nullable: true })
  height?: number;

  @Field(() => Int, { nullable: true })
  width?: number;

  @Field(() => S3ObjectInput)
  s3Object: S3ObjectInput;
}

@InputType()
class UserInput {
  @Field()
  @Length(1, 255)
  firstName: string;

  @Field()
  @Length(1, 255)
  lastName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field(() => PictureInput, { nullable: true })
  profilePicture: PictureInput;

  @Field(() => GraphQLJSONObject, { nullable: true })
  signUpAttributes: any;
}

@InputType()
export class CreateUserInput extends UserInput {
  @Field(() => ID, { nullable: true })
  id: string;
}

@InputType()
export class UpdateUserInput extends UserInput {
  @Field(() => ID)
  id: string;
}
