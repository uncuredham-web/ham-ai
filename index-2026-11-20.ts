    if (urlObj.pathname === '/commit-git' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const files = body.files;
        const commitMessage = body.commit_message || 'Auto-commit from HamAI';

        if (!files || !Array.isArray(files)) {
          return new Response('Invalid files payload', { status: 400 });
        }

        for (const file of files) {
          const path = file.filename;
          console.log(`Processing file: ${path}