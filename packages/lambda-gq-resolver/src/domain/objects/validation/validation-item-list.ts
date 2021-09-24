/* eslint-disable max-classes-per-file */
// import createListObject from 'src/domain/common-objects/higher-order-objects/create-list-object';
import { Field, ObjectType } from 'type-graphql';
import { ValidationItemBase, ValidationItemType } from './validation-item';

const ValidationItemTypeValues = {
  [ValidationItemType.WARN]: 0,
  [ValidationItemType.ERROR]: 1,
};

export const validationLevelHelper = {};

@ObjectType()
class ValidationItemList {
  @Field((type) => [ValidationItemBase])
  private items: Array<ValidationItemBase>;

  private validationLevel: ValidationItemType;

  hasErrors(): boolean {
    return !!this.items.find((vi) => vi.type === ValidationItemType.ERROR);
  }

  hasWarnings(): boolean {
    return !!this.items.find((vi) => vi.type === ValidationItemType.WARN);
  }

  shouldAddWanings(): boolean {
    return ValidationItemTypeValues[this.validationLevel] <= ValidationItemTypeValues[ValidationItemType.WARN] && !this.hasErrors();
  }

  shouldAddErrors(): boolean {
    return ValidationItemTypeValues[this.validationLevel] <= ValidationItemTypeValues[ValidationItemType.ERROR];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  addValidationItem(valiationItem: ValidationItemBase): void {
    this.items.push(valiationItem);
  }

  constructor(validationLevel: ValidationItemType = ValidationItemType.ERROR) {
    this.validationLevel = validationLevel;
    this.items = [];
  }
}

export default ValidationItemList;
