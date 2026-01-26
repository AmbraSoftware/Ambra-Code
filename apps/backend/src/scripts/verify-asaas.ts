
import 'dotenv/config';
import axios from 'axios';

async function verifyAsaasConnection() {
    console.log('--- Verifying Asaas Sandbox Connection ---');
    const apiKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmYwNGNmYjM1LWFhOGUtNGVlOC1hZmE2LWI1OTY4MmRkZDdiYzo6JGFhY2hfYzQ4YmFjNGQtMGQyNy00YWEzLTg4YmItOWIwNTE2OGMyODAx';
    const baseUrl = 'https://sandbox.asaas.com/api/v3';

    try {
        console.log(`Connecting to ${baseUrl}...`);
        const response = await axios.get(`${baseUrl}/payments`, {
            headers: {
                'access_token': apiKey
            },
            params: { limit: 1 }
        });

        if (response.status === 200) {
            console.log('✅ Connection Successful!');
            console.log(`Found ${response.data.totalCount} payments in Sandbox.`);
            console.log('Sample Payment ID:', response.data.data[0]?.id || 'None');
        } else {
            console.error('⚠️ Connection returned status:', response.status);
        }

    } catch (error: any) {
        console.error('❌ Connection Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

verifyAsaasConnection();
