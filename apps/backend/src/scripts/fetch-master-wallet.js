"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function getAsaasMasterInfo() {
    const AS_SANDBOX_TOKEN = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmYwNGNmYjM1LWFhOGUtNGVlOC1hZmE2LWI1OTY4MmRkZDdiYzo6JGFhY2hfYzQ4YmFjNGQtMGQyNy00YWEzLTg4YmItOWIwNTE2OGMyODAx';
    try {
        const api = axios_1.default.create({
            baseURL: 'https://sandbox.asaas.com/api/v3',
            headers: { 'access_token': AS_SANDBOX_TOKEN }
        });
        console.log('Fetching My Account Info...');
        const response = await api.get('/myAccount');
        console.log('MY ACCOUNT DATA:', JSON.stringify(response.data, null, 2));
        try {
            const wallets = await api.get('/wallets');
            console.log('WALLETS DATA:', JSON.stringify(wallets.data, null, 2));
        }
        catch (e) {
            console.log('No /wallets endpoint found or auth error.');
        }
    }
    catch (error) {
        console.error('Error fetching Asaas Info:', error.response?.data || error.message);
    }
}
getAsaasMasterInfo();
//# sourceMappingURL=fetch-master-wallet.js.map