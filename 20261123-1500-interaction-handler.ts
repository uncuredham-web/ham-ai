import { verifyDiscordRequest } from './index';

export async function handleComponentInteraction(request: Request, env: any): Promise<Response> {
  const rawBody = await request.text();
  const isValid = await verifyDiscordRequest(request, rawBody, env.DISCORD_PUBLIC_KEY);
  if (!isValid) {
    return new Response('Invalid request signature', { status: 401 });
  }

  const body = JSON.parse(rawBody);
  
  if (body.type === 3) {
    const customId = body.data?.custom_id;
    
    if (customId && customId.startsWith('task_done_')) {
      const taskId = customId.replace('task_done_', '');
      
      try {
        await completeGoogleTask(env, taskId);
        
        return new Response(JSON.stringify({
          type: 7,
          data: {
            content: 'タスクを完了にしました！お疲れ様です！',
            components: []
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          type: 4,
          data: {
            content: 'タスクの完了処理に失敗しました。',
            flags: 64
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  return new Response('Interactions handled', { status: 200 });
}

async function completeGoogleTask(env: any, taskId: string) {
  const accessToken = env.GOOGLE_ACCESS_TOKEN;
  const taskListId = env.GOOGLE_TASK_LIST_ID;

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'completed'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to update Google Task');
  }
}