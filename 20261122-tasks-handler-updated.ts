export async function handleStretchTasks(env: Env, cron: string) {
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

  const tasksResponse = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    headers: {
      Authorization: 'Bearer ' + tokenData.access_token,
    },
  });

  const taskData = await tasksResponse.json() as { items?: Array<{ title: string; status: string; due?: string }> };
  const items = taskData.items || [];

  const hasTodayStretchTasks = items.some(item => item.title.includes('ストレッチ'));

  if (!hasTodayStretchTasks) {
    // 初回起動の処理（Todo未登録時）
  } else {
    // 通常の通知処理
  }

  return taskData;
}