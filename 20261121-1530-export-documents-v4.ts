// 隠しエンドポイント: /export-documents
    if (urlObj.pathname === '/export-documents') {
      const datasetId = env.DIFY_DATASET_ID;
      const datasetApiKey = env.DIFY_DATASET_API_KEY;

      if (!datasetId || !datasetApiKey) {
        return new Response('Error: DIFY_DATASET_ID or DIFY_DATASET_API_KEY is not configured.', {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      const listRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
        },
      });

      if (!listRes.ok) {
        const errorText = await listRes.text();
        return new Response(`Failed to fetch documents list (${listRes.status}):\n${errorText}`, {
          status: listRes.status,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      const listData: any = await listRes.json().catch(() => null);
      const documents: any[] = listData?.data || [];

      let outputText = `=== Dify Documents & Segments Export (Total: ${documents.length}) ===\n\n`;

      for (const doc of documents) {
        outputText += `--------------------------------------------------\n`;
        outputText += `ID: ${doc.id}\n`;
        outputText += `Name: ${doc.name}\n`;
        outputText += `Created At: ${new Date(doc.created_at * 1000).toLocaleString('ja-JP')}\n`;
        outputText += `--------------------------------------------------\n`;

        const segmentsRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/${doc.id}/segments?page=1&limit=100`, {
          headers: {
            Authorization: `Bearer ${datasetApiKey}`,
          },
        });

        if (segmentsRes.ok) {
          const segmentsData: any = await segmentsRes.json().catch(() => null);
          const segments: any[] = segmentsData?.data || [];

          if (segments.length > 0) {
            outputText += `[Segments / Chunks]\n`;
            for (const seg of segments) {
              outputText += `--- [Segment ID: ${seg.id}] ---\n`;
              outputText += `${seg.content || '(No content)'}\n\n`;
            }
          } else {
            outputText += `(No segments found)\n\n`;
          }
        } else {
          outputText += `(Failed to fetch segments)\n\n`;
        }

        outputText += `\n`;
      }

      return new Response(outputText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }