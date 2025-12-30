// @ts-ignore - africastalking doesn't have type definitions
import AfricasTalking from 'africastalking';
import dotenv from 'dotenv';

dotenv.config();

const africastalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY || '',
  username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
});

export const sms = africastalking.SMS;

export default africastalking;
