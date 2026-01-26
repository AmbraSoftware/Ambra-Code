const API_URL = 'http://localhost:3333';
const GLOBAL_ADMIN_EMAIL = 'admin@nodum.io';
const GLOBAL_ADMIN_PASSWORD = 'Diel@0002323';

async function run() {
    console.log(`[VERIFY] Testing Nodum Console API Integration at ${API_URL}`);

    const api = async (endpoint: string, method: string, body?: any, token?: string) => {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API Error ${res.status}: ${text}`);
        }
        return res.json();
    };

    try {
        // 1. Login
        console.log('1. Attempting Login...');
        const loginRes = await api('/auth/login', 'POST', {
            email: GLOBAL_ADMIN_EMAIL,
            password: GLOBAL_ADMIN_PASSWORD
        });

        const token = loginRes.access_token;
        if (!token) throw new Error('No access_token returned');
        console.log('✅ Login Successful. Token received.');

        // 2. List Systems (Should be empty or have default)
        console.log('2. Listing Systems...');
        const listRes = await api('/platform/systems', 'GET', undefined, token);
        console.log(`✅ Current Systems: ${listRes.length}`);

        // 3. Create System
        console.log('3. Creating Test System...');
        const createRes = await api('/platform/systems', 'POST', {
            name: 'Test Vertical',
            slug: 'test-vertical',
            description: 'Automated Test'
        }, token);
        const newSystemId = createRes.id;
        console.log(`✅ System Created: ${newSystemId}`);

        // 4. Update System
        console.log('4. Updating Test System...');
        await api(`/platform/systems/${newSystemId}`, 'PATCH', {
            name: 'Test Vertical Updated'
        }, token);
        console.log('✅ System Updated');

        // 5. Delete System
        console.log('5. Deleting Test System...');
        await api(`/platform/systems/${newSystemId}`, 'DELETE', undefined, token);
        console.log('✅ System Deleted');

        // 6. List Plans
        console.log('6. Listing Plans...');
        const plans = await api('/platform/plans', 'GET', undefined, token);
        if (plans.length === 0) throw new Error('No Plans Found');
        const planId = plans[0].id;
        console.log(`✅ Found ${plans.length} plans. Using ${planId}`);

        // 7. Get System for School
        // Re-listing to pick a valid stable system (e.g. Ambra from seed)
        const systems = await api('/platform/systems', 'GET', undefined, token);
        const systemId = systems[0].id;

        // 8. Create School
        console.log('7. Creating Test School (Integration Test)...');
        const rand = Math.floor(Math.random() * 10000);
        const schoolPayload = {
            systemId: systemId,
            planId: planId,
            name: `School Integration Test ${rand}`,
            taxId: `52445${rand.toString().padStart(9, '0')}`, // Random CNPJ
            slug: `school-test-${rand}`,
            adminName: 'School Admin',
            adminEmail: `admin.school${rand}@nodum.io`,
            adminPassword: 'Password123!'
        };
        const schoolRes = await api('/tenancy/schools', 'POST', schoolPayload, token);
        console.log(`✅ School Created: ${schoolRes.id}`);

        // 9. Dashboard Stats
        console.log('8. Verifying Dashboard Stats...');
        const dash = await api('/platform/dashboard', 'GET', undefined, token);
        console.log('✅ Dashboard Stats:', dash);
        if (typeof dash.mrr !== 'number') throw new Error('Dashboard returned invalid MRR');

        // 10. Health Check
        console.log('9. Verifying Health Check...');
        const health = await api('/platform/health', 'GET', undefined, token);
        console.log('✅ Health Status:', health.status);
        if (health.status !== 'OPERATIONAL') console.warn('⚠️ System is not fully operational');

        // 11. Global Search
        console.log('10. Verifying Global Search...');
        const search = await api('/platform/search?q=admin', 'GET', undefined, token);
        console.log(`✅ Search Results: ${search.results.length} items found`);
        if (!Array.isArray(search.results)) throw new Error('Invalid search response');

        console.log('--- ALL CHECKS PASSED ---');

    } catch (error: any) {
        console.error('❌ CHECK FAILED:', error.message);
        process.exit(1);
    }
}

run();
