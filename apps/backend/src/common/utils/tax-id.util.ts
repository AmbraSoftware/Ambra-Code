export class TaxIdUtils {
  private static readonly BLACKLIST = [
    '00000000000',
    '11111111111',
    '22222222222',
    '33333333333',
    '44444444444',
    '55555555555',
    '66666666666',
    '77777777777',
    '88888888888',
    '99999999999',
    '00000000000000',
    '11111111111111',
    '22222222222222',
    '33333333333333',
    '44444444444444',
    '55555555555555',
    '66666666666666',
    '77777777777777',
    '88888888888888',
    '99999999999999',
  ];

  static validate(value: string): boolean {
    if (!value) return false;
    const clean = value.replace(/[^\d]/g, '');
    if (this.BLACKLIST.includes(clean)) return false;

    if (clean.length === 11) return this.validateCPF(clean);
    if (clean.length === 14) return this.validateCNPJ(clean);

    return false;
  }

  static validateCPF(cpf: string): boolean {
    const clean = cpf.replace(/[^\d]/g, '');
    if (clean.length !== 11) return false;
    if (this.BLACKLIST.includes(clean)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++)
      sum = sum + parseInt(clean.substring(i - 1, i)) * (11 - i);

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++)
      sum = sum + parseInt(clean.substring(i - 1, i)) * (12 - i);

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(clean.substring(10, 11))) return false;

    return true;
  }

  static validateCNPJ(cnpj: string): boolean {
    const clean = cnpj.replace(/[^\d]/g, '');
    if (clean.length !== 14) return false;
    if (this.BLACKLIST.includes(clean)) return false;

    let length = clean.length - 2;
    let numbers = clean.substring(0, length);
    const digits = clean.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = clean.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }
}
