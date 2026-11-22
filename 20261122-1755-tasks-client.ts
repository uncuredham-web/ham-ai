export async function getStretchTaskListId(accessToken: string): Promise<string | null> {
  const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json() as { items?: { id: string; title: string }[] };
  const stretchList = data.items?.find(item => item.title === 'ストレッチ');
  return stretchList ? stretchList.id : null;
}

export async function createStretchTask(accessToken: string, tasklistId: string, title: string) {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  return await response.json();
}

export async function clearCompletedStretchTasks(accessToken: string, tasklistId: string) {
  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.ok;
}