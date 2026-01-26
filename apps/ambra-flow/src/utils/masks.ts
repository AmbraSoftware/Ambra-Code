export const masks = {
    cpfCnpj: (value: string) => {
        const cleanValue = value.replace(/\D/g, '');

        if (cleanValue.length <= 11) {
            // CPF Mask: 000.000.000-00
            return cleanValue
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        } else {
            // CNPJ Mask: 00.000.000/0000-00
            return cleanValue
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }
    },

    phone: (value: string) => {
        const cleanValue = value.replace(/\D/g, '');

        // Fix: Standardize mobile phone mask to 11 digits (DDD + 9 + 8 digits)
        // (11) 99999-9999
        return cleanValue
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    },

    cep: (value: string) => {
        const cleanValue = value.replace(/\D/g, '');
        return cleanValue
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    },

    removeMask: (value: string) => {
        return value.replace(/\D/g, '');
    }
};
