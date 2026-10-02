// stdio MCP server: every op in the operations table becomes a tool. Works with any MCP client
// (Claude Code, Codex, Gemini CLI, Cursor, Claude Desktop, ...).
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js';
import {OPS} from '../api/ops.ts';
import type {Caller} from '../api/ops.ts';

const MAX_IMAGES = 6; // ponytail: fixed cap keeps tool results small; the rest are listed by path

const MIME: Record<string, string> = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'};

export function createMcpServer(call: Caller): McpServer {
  const server = new McpServer(
    {name: 'motion-orchestrator', version: '0.1.0'},
    {
      instructions:
        'Motion Orchestrator makes motion-graphics videos with a team of AI agents. Typical flow: get_config → ' +
        'plan_video {idea, seconds} → show plan + estimate to the user → approve {what:"plan"} → start_run → poll ' +
        'run_status. If any role is "host", that is you: do those jobs with claim_job → edit files → submit_job.',
    },
  );
  for (const op of OPS) {
    server.registerTool(op.name, {description: op.description, inputSchema: op.input}, async (args: unknown): Promise<CallToolResult> => {
      try {
        const result = await call(op.name, args);
        const content: CallToolResult['content'] = [{type: 'text', text: JSON.stringify(result, null, 2)}];
        if (op.name === 'get_stills') {
          for (const p of (result as {stills: string[]}).stills.slice(0, MAX_IMAGES)) {
            const mimeType = MIME[extname(p).toLowerCase()];
            if (mimeType) content.push({type: 'image', data: (await readFile(p)).toString('base64'), mimeType});
          }
        }
        return {content};
      } catch (e) {
        return {isError: true, content: [{type: 'text', text: `${op.name} failed: ${(e as Error).message}`}]};
      }
    });
  }
  return server;
}

export async function startMcpServer(call: Caller): Promise<void> {
  // stdout belongs to the protocol: route stray logs from the pipeline to stderr.
  console.log = console.info = console.error;
  await createMcpServer(call).connect(new StdioServerTransport());
}
