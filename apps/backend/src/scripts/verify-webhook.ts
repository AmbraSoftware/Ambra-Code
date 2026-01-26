import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testWebhook() {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('⚠️ DISCORD_WEBHOOK_URL is not configured in .env');
        return;
    }

    // Masking the URL for security in logs
    console.log(`Found webhook URL: ${webhookUrl.substring(0, 35)}...`);

    const message = {
        content: `🧪 **Test Webhook - Verification**`,
        embeds: [{
            title: `Webhook Verification Test`,
            description: `This is a test message to verify Discord Webhook configuration.`,
            color: 0x0099FF,
            timestamp: new Date().toISOString(),
            fields: [
                { name: 'Status', value: 'Functional', inline: true },
                { name: 'Time', value: new Date().toLocaleTimeString(), inline: true }
            ],
            footer: {
                text: 'Sent by Antigravity Verification Script',
            },
        }],
    };

    try {
        await axios.post(webhookUrl, message);
        console.log('✅ Webhook sent successfully! Check your Discord channel.');
    } catch (error: any) {
        console.error('❌ Failed to send webhook:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data));
        }
    }
}

testWebhook();
