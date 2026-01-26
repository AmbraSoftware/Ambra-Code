"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv.config();
async function testWebhook() {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.log('⚠️ DISCORD_WEBHOOK_URL is not configured in .env');
        return;
    }
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
        await axios_1.default.post(webhookUrl, message);
        console.log('✅ Webhook sent successfully! Check your Discord channel.');
    }
    catch (error) {
        console.error('❌ Failed to send webhook:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data));
        }
    }
}
testWebhook();
//# sourceMappingURL=verify-webhook.js.map