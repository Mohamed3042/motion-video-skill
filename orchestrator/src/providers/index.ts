import {anthropicProvider} from './anthropic.ts';
import {openaiProvider} from './openai.ts';
import type {Connection, Provider} from '../types.ts';

export function makeProvider(connection: Connection): Provider {
  if (connection.kind === 'openai') return openaiProvider(connection);
  if (connection.kind === 'anthropic') return anthropicProvider(connection);
  throw new Error(`Connection "${connection.id}" is the MCP host: its jobs are done by the connected agent (claim_job / submit_job), not through an API.`);
}
