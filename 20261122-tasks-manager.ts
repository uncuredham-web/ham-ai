import { Env } from './index';

export async function handleStretchTasks(env: Env, cron: string): Promise<void> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const tokenData = await tokenResponse.json() as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error('Failed to retrieve access token');
  }

  const accessToken = tokenData.access_token;
  const tasksUrl = 'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks';

  const tasksResponse = await fetch(tasksUrl, {
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  });

  const taskData = await tasksResponse.json() as { items?: Array<{ id: string, title: string, status: string }> };
  const items = taskData.items || [];

  const hasTodayStretchTasks = items.some(item => item.title.includes('ストレッチ'));

  if (!hasTodayStretchTasks) {
    const previousIncompleteCount = items.filter(item => item.status === 'needsAction').length;

    if (previousIncompleteCount > 0 && cron === '0 11 * * *') {
      await fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `昨日は ${previousIncompleteCount} 件の未達成ストレッチがありました。本日の朝の起動に伴い、これらは自動破棄されました！`
        }),
      });

      for (const item of items) {
        if (item.status === 'needsAction') {
          await fetch(`${tasksUrl}/${item.id}`, {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + accessToken },
          });
        }
      }
    }

    const stretchTimes = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
    for (const time of stretchTimes) {
      await fetch(tasksUrl, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `[ストレッチ] ${time} の運動タイム`,
        }),
      });
    }

    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'おはようございます！本日のストレッチTodoを登録しました。今日も頑張りましょう！'
      }),
    });

  } else {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'そろそろストレッチの時間ですよ！体をほぐしましょう。',
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 3,
                label: 'やった！',
                custom_id: 'stretch_done'
              },
              {
                type: 2,
                style: 4,
                label: 'できない！',
                custom_id: 'stretch_failed'
              }
            ]
          }
        ]
      }),
    });
  }
}