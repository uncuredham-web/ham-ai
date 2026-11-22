export async function callDifyApi(prompt: string, env: any) {
  const response = await fetch('https://api.dify.ai/v1/chat-messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
      user: 'ham-user'
    }),
  });
  return await response.json();
}