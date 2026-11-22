import { Env } from './types';

export async function handleComponentInteraction(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const bodyText = await request.text();

  // TODO: Discord Ed25519の署名検証をここに実装する

  const interaction = JSON.parse(bodyText);

  if (interaction.type === 1) {
    // PING
    return Response.json({ type: 1 });
  }

  if (interaction.type === 3) {
    // Message Component (ボタン等)
    const customId = interaction.data.custom_id;
    // 例: task_completed_<taskId>
    if (customId.startsWith('task_completed_')) {
      const taskId = customId.replace('task_completed_',);
      
      // Google Tasks APIを使用して該当タスクを完了状態にする処理をここに呼び出す

      return Response.json({
        type: 7,
        data: {
          content: 'タスクを完了にしました！お疲れ様です！',
          components: []
        }
      });
    }
  }

  return new Response('Invalid interaction', { status: 400 });
}