import { Provider } from '@nestjs/common';
import { OpenAI } from 'openai';
import { env } from 'node:process';
import { OPENAI_MAX_RETRIES, OPENAI_TIMEOUT_MS } from './llm.config';

export const OPENAI_CLIENT = 'OPENAI_CLIENT';

export const OpenAiClientProvider: Provider = {
  provide: OPENAI_CLIENT,
  // Transport-level caps (improvements.md #11): every call inherits a request
  // timeout and a bounded retry count so a single slow/failed call can't hang
  // the whole chat request indefinitely.
  useFactory: () =>
    new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
      timeout: OPENAI_TIMEOUT_MS,
      maxRetries: OPENAI_MAX_RETRIES,
    }),
};
