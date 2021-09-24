/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import { Field, ObjectType, ID, registerEnumType, InterfaceType } from 'type-graphql';
import { Model } from '@shiftcoders/dynamo-easy';

export enum ValidationItemType {
  ERROR = 'ERROR',
  WARN = 'WARN',
}

registerEnumType(ValidationItemType, {
  name: 'ValidationItemType', // this one is mandatory
});

export enum ValidationItemMessage {
  OPENHEAT_ALREADYOPEN = 'OpenHeat.AlreadyOpen ',
  OPENHEAT_NORIDERS = 'OpenHeat.NoRiders',
  OPENHEAT_TOOFEWRIDERS = 'OpenHeat.TooFewRiders',
  OPENHEAT_NOTREADY = 'OpenHeat.NotReady',
  OPENHEAT_NOTFULL = 'OpenHeat.NotFull',
  OPENHEAT_ALREADYFINISHED = 'OpenHeat.AlreadyFinished',
  ENDHEAT_NOTREADY = 'EndHeat.NotReady',
  ENDHEAT_NOTFULLYSCORED = 'EndHeat.NotFullyScored',
  ENDHEAT_CANCEL = 'EndHeat.Cancel',
}

registerEnumType(ValidationItemMessage, {
  name: 'ValidationItemMessage', // this one is mandatory
});

@InterfaceType()
export class ValidationItemBase {
  constructor(type: ValidationItemType, message: ValidationItemMessage) {
    this.type = type;
    this.message = message;
  }

  @Field(() => ValidationItemType)
  type: ValidationItemType;

  @Field(() => ValidationItemMessage)
  message: ValidationItemMessage;
}

@ObjectType({ implements: [ValidationItemBase] })
export class ValidationItem extends ValidationItemBase {
  static CreateErrorInstance(message: ValidationItemMessage): ValidationItem {
    return new ValidationItem(ValidationItemType.ERROR, message);
  }

  static CreateWarnInstance(message: ValidationItemMessage): ValidationItem {
    return new ValidationItem(ValidationItemType.WARN, message);
  }
}
