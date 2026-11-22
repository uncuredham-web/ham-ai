import { verifyDiscordRequest } from './index';

export async function handleComponentInteraction(request: Request, env: any): Promise<Response> {
  const rawBody = await request.text();
  const isValid = await verifyDiscordRequest(request, rawBody, env.DISCORD_PUBLIC_KEY);
  if (!isValid) {
    return new Response('Invalid request signature', { status: 401 });
  }

  const body = JSON.parse(rawBody);
  if (body.type === 3 && body.data && body.data.custom_id) {
    const customId = body.data.custom_id;

    if (customId.startsWith('task_done_')) {
      const taskId = customId.replace('task_done_', '');

      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            refresh_token: env.GOOGLE_REFRESH_TOKEN,
            grant_type: 'refresh_token',
          }),
        });

        const tokenData: any = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (accessToken) {
          const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'completed' }),
          });

          if (taskRes.ok) {
            return new Response(JSON.stringify({
              type: 7,
              data: {
                content: 'タスクを完了に更新しました！お疲れ様です！',
                components: []
              }
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  return new Response(JSON.stringify({ type: 6 }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
