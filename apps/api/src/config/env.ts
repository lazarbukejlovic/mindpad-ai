import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
};
