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
    const newMemoryEntry = `【日付: ${jstDate} ${timeStr} | カテゴリ: ${categoryName} | チャンネル: ${channelName}】\n${memoryText.trim()}`;

    // 1. 既存のドキュメント一覧を取得して、同じ名前のドキュメントがあるか探す
    const listRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents?page=1&limit=100`, {
      headers: {
        Authorization: `Bearer ${datasetApiKey}`,
      },
    });

    if (!listRes.ok) return;

    const listData: any = await listRes.json().catch(() => null);
    const documents: any[] = listData?.data || [];
    const existingDoc = documents.find(doc => doc.name === docName);

    if (!existingDoc) {
      // 2-A. 存在しない場合は新規作成
      const createRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/document/create-by-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: docName,
          text: newMemoryEntry,
          indexing_technique: 'high_quality',
          process_rule: { mode: 'automatic' },
        }),
      });

      if (!createRes.ok) return;
      const createData: any = await createRes.json().catch(() => null);
      const documentId = createData?.document?.id;
      if (!documentId) return;

      // メタデータ付与処理（省略せずに結合）
      await applyMetadata(datasetId, datasetApiKey, documentId, categoryName, channelName, jstDate);
    } else {
      // 2-B. 存在する場合には既存のセグメント（テキスト）を取得して結合する
      const documentId = existingDoc.id;
      const segmentsRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/${documentId}/segments?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
        },
      });

      let existingText = '';
      if (segmentsRes.ok) {
        const segmentsData: any = await segmentsRes.json().catch(() => null);
        const segments: any[] = segmentsData?.data || [];
        if (segments.length > 0) {
          existingText = segments.map(seg => seg.content).join('\n\n');
        }
      }

      // 過去のテキストと新しいテキストを結合
      const combinedText = existingText ? `${existingText}\n\n---\n\n${newMemoryEntry}` : newMemoryEntry;

      // 3. 結合したテキストでドキュメントを更新（アップデート）
      await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/document/${documentId}/update-by-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: docName,
          text: combinedText,
          indexing_technique: 'high_quality',
          process_rule: { mode: 'automatic' },
        }),
      });
    }
  } catch (error) {
    console.error('[MemoryError]', error);
    return;
  }
}

// メタデータ付与のヘルパー関数
async function applyMetadata(datasetId: string, datasetApiKey: string, documentId: string, categoryName: string, channelName: string, jstDate: string) {
  const metaListRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/metadata`, {
    headers: { Authorization: `Bearer ${datasetApiKey}` },
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

  if (metadataList.length === 0) return;

  await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/metadata`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${datasetApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation_data: [{ document_id: documentId, metadata_list: metadataList }],
    }),
  });
}