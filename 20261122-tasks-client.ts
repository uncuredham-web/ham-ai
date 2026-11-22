export async function fetchAndCreateStretchTasks(accessToken: string, taskListId: string): Promise<void> {
  const tasks = [
    { title: '【ストレッチ】首と肩の運動' },
    { title: '【ストレッチ】腰と背中の柔軟' },
    { title: '【ストレッチ】足のストレッチ' }
  ];

  for (const task of tasks) {
    await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
  }
}