import axios from 'axios';

async function getAsaasMasterInfo() {
  const AS_SANDBOX_TOKEN =
    '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmYwNGNmYjM1LWFhOGUtNGVlOC1hZmE2LWI1OTY4MmRkZDdiYzo6JGFhY2hfYzQ4YmFjNGQtMGQyNy00YWEzLTg4YmItOWIwNTE2OGMyODAx';

  try {
    const api = axios.create({
      baseURL: 'https://sandbox.asaas.com/api/v3',
      headers: { access_token: AS_SANDBOX_TOKEN },
    });

    console.log('Fetching My Account Info...');
    // Endpoint to get current account details (often acts as wallet reference)
    // NOTE: In Asaas V3, the 'walletId' for the main account might be its 'id' returned here
    // OR we might need to look for specific wallet endpoints.
    // Usually, the account ID (cus_... or explicit id) serves as destination.
    // However, for SPLIT, we need a "walletId".
    // Let's check what this returns.

    // Try obtaining wallets list if available, otherwise account info.
    // There isn't a public /wallets endpoint documented for "my own wallet id" easily,
    // but let's try /myAccount first.

    const response = await api.get('/myAccount');
    console.log('MY ACCOUNT DATA:', JSON.stringify(response.data, null, 2));

    // Also try /wallets just in case it exists in V3 or similar
    try {
      const wallets = await api.get('/wallets');
      console.log('WALLETS DATA:', JSON.stringify(wallets.data, null, 2));
    } catch (e) {
      console.log('No /wallets endpoint found or auth error.');
    }
  } catch (error) {
    console.error(
      'Error fetching Asaas Info:',
      error.response?.data || error.message,
    );
  }
}

getAsaasMasterInfo();
