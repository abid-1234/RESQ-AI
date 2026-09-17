import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  mongoUri: process.env.MONGODB_URI || process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  aiMode: (process.env.AI_MODE || 'DEMO') as 'DEMO' | 'RESEARCH' | 'VALIDATED' | 'LIVE',
  automaticMode: (process.env.AUTOMATIC_MODE || 'true').toLowerCase() === 'true',
  mqtt: {
    broker: process.env.MQTT_BROKER || '',
    port: parseInt(process.env.MQTT_PORT || '8883', 10),
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    tls: (process.env.MQTT_TLS || 'true').toLowerCase() === 'true',
  },
  cbcAdapter: (process.env.CBC_ADAPTER || 'mock_cbc') as 'mock_cbc' | 'production',
  cbcApiUrl: process.env.CBC_API_URL || '',
  cbcApiKey: process.env.CBC_API_KEY || '',
  smsApiKey: process.env.SMS_API_KEY || '',
  smsApiUrl: process.env.SMS_API_URL || '',
  emailHost: process.env.EMAIL_HOST || '',
  emailPort: parseInt(process.env.EMAIL_PORT || '587', 10),
  emailUser: process.env.EMAIL_USER || '',
  emailPassword: process.env.EMAIL_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@resq-ai.local',
};
