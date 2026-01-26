import axios from 'axios';

export interface ViaCepResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
}

export const viacepService = {
    getAddressByCep: async (cep: string): Promise<ViaCepResponse | null> => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return null;

        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
            if (response.data.erro) return null;
            return response.data;
        } catch (error) {
            console.error('ViaCEP Error:', error);
            return null;
        }
    }
};
