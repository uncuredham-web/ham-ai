    if (urlObj.pathname === '/commit-git' && request.method === 'POST') {
      try {
        const rawText = await request.text();
        let body: any;
        try {
          body = JSON.parse(rawText);
        } catch (jsonErr: any) {
          throw new Error(`Invalid JSON payload: ${jsonErr.message} (Raw: ${rawText.slice(0, 100)})`);
        }

        const files = body.files;
        const commitMessage = body.commit_message || 'Auto-commit from HamAI';

        if (!files || !Array.isArray(files)) {
          return new Response('Invalid files payload', { status: 400 });
        }

        for (const file of files) {
          const path = file.filename;
          const contentBase64 = btoa(unescape(encodeURIComponent(file.content)));
          const apiUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`;

          let sha: string | undefined = undefined;
          const getRes = await fetch(apiUrl, {\n            headers: {\n              'Authorization': `Bearer ${env.GITHUB_TOKEN}`