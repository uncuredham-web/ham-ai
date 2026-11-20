// 回答に含まれるファイルオブジェクトをgitにコミットする
    if (urlObj.pathname === '/commit-git' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const files = body.files; // Difyから送られてくるファイルオブジェクトの配列
        const commitMessage = body.commit_message || 'Auto-commit from HamAI';

        if (!files || !Array.isArray(files)) {
          return new Response('Invalid files payload', { status: 400 });
        }

        for (const file of files) {
          const path = file.filename;
          
          // モダンなTextEncoderを使用したBase64エンコード
          const utf8Bytes = new TextEncoder().encode(file.content);
          let binaryString = '';
          for (let i = 0; i < utf8Bytes.length; i++) {
            binaryString += String.fromCharCode(utf8Bytes[i]);
          }
          const contentBase64 = btoa(binaryString);

          console.log(`[HamAI-Worker] Processing file: ${path}, content length: ${file.content.length}`);

          const apiUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`;

          let sha: string | undefined = undefined;
          const getRes = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
              'User-Agent': 'HamAI-Worker',
              'Accept': 'vnd.github+json'
            }
          });

          if (getRes.ok) {
            const existing: any = await getRes.json();
            sha = existing.sha;
          }

          const putBody: any = {
            message: `${commitMessage}: ${path}`,
            content: contentBase64,
            branch: env.GITHUB_BRANCH
          };
          if (sha) {
            putBody.sha = sha;
          }

          const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
              'User-Agent': 'HamAI-Worker',
              'Accept': 'vnd.github+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(putBody)
          });

          if (!putRes.ok) {
            const errText = await putRes.text();
            throw new Error(`GitHub API error for ${path}: ${errText}`);
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error: any) {
        console.error(`[HamAI-Worker] Error in /commit-git: ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }