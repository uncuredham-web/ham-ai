import { verifyDiscordRequest } from './index';

export async function handleComponentInteraction(request: Request, env: any): Promise<Response> {
  const rawBody = await request.text();
  const isValid = await verifyDiscordRequest(request, rawBody, env.DISCORD_PUBLIC_KEY);
  if (!isValid) {
    return new Response('Invalid request signature', { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const customId = body.data?.custom_id;

  if (customId && customId.startsWith('task_done_')) {
    const taskId = customId.replace('task_done_', '');
    
    return new Response(JSON.stringify({
      type: 7,
      data: {
        content: 'タスクを完了にしました！',
        components: []
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ type: 6 }), {
    headers: { 'Content-Type': 'application/json' }
  });
}