export async function commitToGitHub(dslContent: string, env: any) {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/dsl.yml`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker'
    }
  });
  const fileData = await response.json() as { sha?: string };
  
  await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'User-Agent': 'Cloudflare-Worker',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Auto commit DSL from Dify',
      content: btoa(unescape(encodeURIComponent(dslContent))),
      sha: fileData.sha
    })
  });
}