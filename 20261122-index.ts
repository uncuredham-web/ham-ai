import { callDifyApi } from './20261122-dify-client';
import { commitToGitHub } from './20261122-github-client';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'POST') {
      const data = await request.json() as { query?: string, dsl?: string };
      if (data.query) {
        const difyResult = await callDifyApi(data.query, env);
        return new Response(JSON.stringify(difyResult), { headers: { 'Content-Type': 'application/json' } });
      }
      if (data.dsl) {
        await commitToGitHub(data.dsl, env);
        return new Response('Committed successfully');
      }
    }
    return new Response('Discord Dify Bot is running.');
  }
};