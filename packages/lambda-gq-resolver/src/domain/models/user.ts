/* eslint-disable max-len */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import { Ctx, Field, Int, ObjectType, registerEnumType } from 'type-graphql';
import Identifiable from 'src/domain/interfaces/identifiable';
import * as utils from 'src/utils/utility';
import { commonConfig } from '@alpaca-backend/common';
import { GSISortKey, Model } from '@shiftcoders/dynamo-easy';
import Creatable from 'src/domain/interfaces/creatable';
import { IContext } from 'src/typegraphql-setup/context';
import aws from 'aws-sdk';
import { IdentityType } from 'src/types';

const tableSchema = commonConfig.DB_SCHEMA.User;

// Always use default cloud config
const s3 = new aws.S3({ endpoint: undefined, region: undefined });

export enum FederationType {
  FACEBOOK = 'FACEBOOK',
}

registerEnumType(FederationType, {
  name: 'FederationType', // this one is mandatory
});

@Model()
export class S3Object {
  @Field(() => String)
  bucket: string;

  @Field(() => String)
  key: string;
}

@Model()
export class S3Picture {
  @Field(() => Int, { nullable: true })
  height?: number;

  @Field(() => Int, { nullable: true })
  width?: number;

  @Field(() => S3Object)
  s3Object: S3Object;
}

@ObjectType()
export class UploadRequest {
  @Field(() => String)
  signedRequest: string;

  @Field(() => String)
  url: string;
}

@ObjectType()
export class Picture {
  private s3Picture: S3Picture;

  private ownerUserId: string;

  constructor(s3Picture: S3Picture, ownerUserId: string) {
    this.s3Picture = s3Picture;
    this.ownerUserId = ownerUserId;
  }

  @Field({ name: 'height', nullable: true })
  getHeight(): number {
    return this.s3Picture?.height;
  }

  @Field({ name: 'width', nullable: true })
  getWidth(): number {
    return this.s3Picture?.width;
  }

  @Field({ name: 'getUrl', nullable: true })
  getGetUrl(): string {
    const presignedGetUrl = s3.getSignedUrl('getObject', {
      Bucket: this.s3Picture.s3Object.bucket,
      Key: this.s3Picture.s3Object.key, // filename
      Expires: 3600, // time to expire - 1 hour
    });
    return presignedGetUrl;
  }

  @Field({ name: 'putUrl', nullable: true })
  getPutUrl(@Ctx() ctx: IContext): string {
    if (
      ctx.identity.type === IdentityType.NONE ||
      ctx.identity.type === IdentityType.ROLE ||
      (ctx.identity.type === IdentityType.USER && ctx.identity.user.username === this.ownerUserId)
    ) {
      const presignedPutUrl = s3.getSignedUrl('putObject', {
        Bucket: this.s3Picture.s3Object.bucket,
        Key: this.s3Picture.s3Object.key,
        Expires: 60,
        ContentType: 'application/octet-stream',
        ACL: 'public-read',
      });
      return presignedPutUrl;
    }

    return null;
  }
}

@ObjectType({ implements: [Identifiable, Creatable] })
@Model({ tableName: utils.getTableName(tableSchema.tableName) })
class User extends Identifiable {
  mapIn(loadedValues: any): void {
    super.mapIn(loadedValues);
    if (this.profilePicture) {
      this.profilePicture = _.merge(new S3Picture(), this.profilePicture);
    }
  }

  profilePicture: S3Picture;

  @Field(() => Picture, { name: 'profilePicture', nullable: true })
  async getProfilePicture(): Promise<Picture> {
    if (!this?.profilePicture?.s3Object) {
      return null;
    }

    return new Picture(this.profilePicture, this.id);
  }

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field({ nullable: true })
  isDemo: boolean;

  @GSISortKey(tableSchema.indexes.byLastName.indexName)
  @Field()
  lastName: string;

  fullNameHash: string;

  isDbOnlyUser: boolean;

  @Field({ name: 'fullName' })
  getFullName(): string {
    const { firstName, lastName } = this;
    return `${firstName}${lastName ? ` ${lastName}` : ''}`;
  }

  static IsDemoUserId(id: string): boolean {
    return id.startsWith(User.DemoUserPrefix);
  }

  preSave(): void {
    this.fullNameHash = User.GetFullNameHash(this.firstName, this.lastName);
    super.preSave();
  }

  static CreateDemoUser(id: string): User {
    const demoUser = new User();
    if (!User.IsDemoUserId(id)) {
      throw new Error(`Demo user ids must start with ${User.DemoUserPrefix}`);
    }
    demoUser.id = id;
    demoUser.email = `${id}@gmail.com`;
    demoUser.firstName = 'Demo Rider';
    demoUser.lastName = id.split('-').pop();
    demoUser.isDemo = true;
    return demoUser;
  }

  static GetFullNameHash(firstName: string, lastName: string): string {
    const hashName = (value: string) => value?.replace(/\s/g, '-').toUpperCase();
    return `${hashName(lastName)}_${hashName(firstName)}`;
  }

  static DemoUserPrefix = 'demo-user';
}

export default User;
