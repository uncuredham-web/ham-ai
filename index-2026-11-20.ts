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
          
          // 非推奨のunescapeを使わず、TextEncoderで安全にBase64エンコードする方式
          const utf8Bytes = new TextEncoder().encode(file.content);
          const binaryString = String.fromCharCode(...utf8Bytes);
          const contentBase64 = btoa(binaryString);

          const apiUrl = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`;

          let sha: string | undefined = undefined;
          const getRes = await fetch(apiUrl, {\n            headers: {\n              'Authorization': `Bearer ${env.GITHUB_TOKEN}`