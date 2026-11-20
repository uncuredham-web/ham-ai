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
          const getRes = await fetch(apiUrl, {\n            headers: {\n              'Authorization': `Bearer ${env.GITHUB_TOKEN}`