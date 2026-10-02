// Tiny local HTTP server for offline provider tests: records every request, replies via a handler.
import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';

export type MockRequest = {method: string; url: string; headers: Record<string, string | string[] | undefined>; body: any; at: number};
export type MockReply = {status?: number; headers?: Record<string, string>; body?: unknown};

export async function startMock(handler: (req: MockRequest, index: number) => MockReply | Promise<MockReply>) {
  const requests: MockRequest[] = [];
  const server = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const r: MockRequest = {method: req.method ?? '', url: req.url ?? '', headers: req.headers, body: raw ? JSON.parse(raw) : undefined, at: Date.now()};
    requests.push(r);
    const reply = await handler(r, requests.length - 1);
    res.writeHead(reply.status ?? 200, {'content-type': 'application/json', ...reply.headers});
    res.end(JSON.stringify(reply.body ?? {}));
  });
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
  const {port} = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise<void>((ok) => {
        server.close(() => ok());
        server.closeAllConnections();
      }),
  };
}
