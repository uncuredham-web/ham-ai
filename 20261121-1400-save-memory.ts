async function saveLongTermMemory(
  memoryText: string,
  categoryName: string,
  channelName: string,
  datasetId: string,
  datasetApiKey: string
) {
  if (!datasetId || !datasetApiKey || !memoryText.trim()) return;

  try {
    const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0] || '';
    const timeStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[1].slice(0, 5);
    const docName = `${categoryName} / ${channelName}`;
    const newEntry = `---
【日付: ${jstDate} ${timeStr} | カテゴリ: ${categoryName} | チャンネル: ${channelName}】
${memoryText.trim()}`;

    // 1. 既存のドキュメント一覧を取得して、同じカテゴリ・チャンネル名のものがあるか探す
    const listRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents?keyword=${encodeURIComponent(docName)}`, {
      headers: {
        Authorization: `Bearer ${datasetApiKey}`,
      },
    });

    let existingDocId: string | null = null;
    let existingContent: string = '';

    if (listRes.ok) {
      const listData: any = await listRes.json().catch(() => null);
      const documents = listData?.data || [];
      const matchedDoc = documents.find((doc: any) => doc.name === docName);
      if (matchedDoc) {
        existingDocId = matchedDoc.id;

        // 既存ドキュメントのテキスト内容を取得する
        const detailRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/${existingDocId}/segment`, {
          headers: {
            Authorization: `Bearer ${datasetApiKey}`,
          },
        });
        if (detailRes.ok) {
          const detailData: any = await detailRes.json().catch(() => null);
          const segments = detailData?.data || [];
          existingContent = segments.map((s: any) => s.content).join('\n\n');
        }
      }
    }

    const updatedText = existingContent ? `${existingContent}\n\n${newEntry}` : newEntry;

    if (existingDocId) {
      // 2. 既存ドキュメントがある場合は更新（追記）する
      await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/${existingDocId}/update-by-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: docName,
          text: updatedText,
          process_rule: { mode: 'automatic' },
        }),
      });
    } else {
      // 3. ない場合は新規作成する
      const createRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/document/create-by-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: docName,
          text: updatedText,
          indexing_technique: 'high_quality',
          process_rule: { mode: 'automatic' },
        }),
      });

      if (!createRes.ok) return;

      const createData: any = await createRes.json().catch(() => null);
      const documentId = createData?.document?.id;
      if (!documentId) return;

      // メタデータの設定
      const metaListRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/metadata`, {
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
        },
      });

      if (!metaListRes.ok) return;

      const metaListData: any = await metaListRes.json().catch(() => null);
      const fields: any[] = metaListData?.doc_metadata || [];

      const metadataList: any[] = [];
      for (const field of fields) {
        if (field.name === 'category_name') {
          metadataList.push({ id: field.id, name: 'category_name', value: categoryName });
        } else if (field.name === 'channel_name') {
          metadataList.push({ id: field.id, name: 'channel_name', value: channelName });
        } else if (field.name === 'date') {
          metadataList.push({ id: field.id, name: 'date', value: jstDate });
        }
      }

      if (metadataList.length > 0) {
        await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/metadata`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${datasetApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation_data: [
              {
                document_id: documentId,
                metadata_list: metadataList,
              },
            ],
          }),
        });
      }
    }
  } catch {
    return;
  }
}