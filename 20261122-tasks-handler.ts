export interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
}

export async function fetchGoogleTasks(env: Env) {
  // OAuthリフレッシュトークンを使用してアクセストークンを取得するロジックのサンプルです
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

  // Google Tasks APIを叩いてタスク一覧を取得する処理
  const tasksResponse = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    headers: {
      Authorization: 'Bearer ' + tokenData.access_token,
    },
  });

  return await tasksResponse.json();
}