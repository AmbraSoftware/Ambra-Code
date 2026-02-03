import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TaxIdUtils } from '../utils/tax-id.util';

@ValidatorConstraint({ async: false })
export class IsCpfCnpjConstraint implements ValidatorConstraintInterface {
  validate(taxId: string) {
    // If optional fields are null/undefined, let @IsOptional handle it.
    // Here we assume if value is present, it must be valid.
    if (!taxId) return false;
    return TaxIdUtils.validate(taxId);
  }

  defaultMessage() {
    return 'CPF ou CNPJ inválido.';
  }
}

export function IsCpfCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfCnpjConstraint,
    });
  };
}
