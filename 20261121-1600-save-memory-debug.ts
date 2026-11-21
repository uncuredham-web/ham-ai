async function saveLongTermMemory(
  memoryText: string,
  categoryName: string,
  channelName: string,
  datasetId: string,
  datasetApiKey: string
) {
  if (!datasetId || !datasetApiKey || !memoryText.trim()) {
    console.log('[MemoryDebug] Validation failed: missing id, key, or text.');
    return;
  }

  try {
    const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0] || '';
    const timeStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[1].slice(0, 5);
    const newMemoryEntry = `【日付: ${jstDate} ${timeStr} | カテゴリ: ${categoryName} | チャンネル: ${channelName}】\n${memoryText.trim()}`;

    // 1. 既存のドキュメント一覧を取得して、同じカテゴリ/チャンネルのものが無いか探す
    const listRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents?page=1&limit=100`, {
      headers: {
        Authorization: `Bearer ${datasetApiKey}`,
      },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      console.log(`[MemoryDebug] Failed to fetch documents list: ${listRes.status} - ${errText}`);
      return;
    }

    const listData: any = await listRes.json().catch(() => null);
    const documents: any[] = listData?.data || [];

    // ドキュメント名が `[カテゴリ / チャンネル]` のような形式で保存されていると仮定して検索
    const targetDocName = `${categoryName} / ${channelName}`;
    const existingDoc = documents.find(doc => doc.name && doc.name.includes(targetDocName));

    let documentId = existingDoc?.id;
    let existingContent = '';

    if (documentId) {
      console.log(`[MemoryDebug] Found existing document ID: ${documentId}`);
      // 2. 既存ドキュメントのセグメント（チャンク）から既存テキストを回収する
      const segmentsRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/${documentId}/segments?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
        },
      });

      if (segmentsRes.ok) {
        const segmentsData: any = await segmentsRes.json().catch(() => null);
        const segments: any[] = segmentsData?.data || [];
        existingContent = segments.map(seg => seg.content).filter(Boolean).join('\n\n');
        console.log(`[MemoryDebug] Retrieved existing content length: ${existingContent.length}`);
      } else {
        console.log(`[MemoryDebug] Failed to fetch segments for existing doc, will overwrite or append.`);
      }
    } else {
      console.log(`[MemoryDebug] No existing document found. Will create a new one.`);
    }

    // 3. 既存のコンテンツと新しいメモリを結合
    const combinedText = existingContent
      ? `${existingContent}\n\n---\n\n${newMemoryEntry}`
      : newMemoryEntry;

    if (documentId) {
      // 4. 既存ドキュメントを更新 (update-by-text)
      console.log(`[MemoryDebug] Updating document ${documentId} with combined text...`);
      const updateRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/${documentId}/update-by-text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${datasetApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `[${categoryName} / ${channelName}]`,
          text: combinedText,
          process_rule: { mode: 'automatic' },
        }),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.log(`[MemoryDebug] Failed to update document: ${updateRes.status} - ${errText}`);
        return;
      }
      console.log(`[MemoryDebug] Successfully updated document ${documentId}`);
    } else {
      // 5. 新規ドキュメントを作成 (create-by-text)
      const docName = `[${jstDate} ${timeStr}] ${categoryName} / ${channelName}`;
      console.log(`[MemoryDebug] Creating new document: ${docName}`);
      
      const createRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/document/create-by-text`, {
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

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.log(`[MemoryDebug] Failed to create document: ${createRes.status} - ${errText}`);
        return;
      }

      const createData: any = await createRes.json().catch(() => null);
      documentId = createData?.document?.id;
      console.log(`[MemoryDebug] Successfully created new document ID: ${documentId}`);
      if (!documentId) return;

      // メタデータの付与処理（新規作成時のみ）
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
        console.log(`[MemoryDebug] Metadata successfully attached to new document.`);
      }
    }
  } catch (err) {
    console.log(`[MemoryDebug] Exception caught in saveLongTermMemory:`, err);
    return;
  }
}