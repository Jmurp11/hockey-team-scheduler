import { Provider } from '@nestjs/common';
import { OpenAI } from 'openai';
import { env } from 'node:process';

export const OPENAI_CLIENT = 'OPENAI_CLIENT';

export const OpenAiClientProvider: Provider = {
  provide: OPENAI_CLIENT,
  useFactory: () => new OpenAI({ apiKey: env.OPENAI_API_KEY || '' }),
};
