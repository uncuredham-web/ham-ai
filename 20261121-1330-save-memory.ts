async function saveLongTermMemory(
  memoryText: string,
  categoryName: string,
  channelName: string,
  datasetId: string,
  datasetApiKey: string
) {
  if (!datasetId || !datasetApiKey || !memoryText.trim()) {
    console.log('[MemoryDebug] Skipped: Missing datasetId, datasetApiKey, or empty memoryText.');
    return;
  }

  try {
    const jstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0] || '';
    const timeStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[1].slice(0, 5);
    const docName = `[${jstDate} ${timeStr}] ${categoryName} / ${channelName}`;

    console.log('[MemoryDebug] Creating document with name:', docName);

    const createRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/document/create-by-text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${datasetApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: docName,
        text: `【日付: ${jstDate} | カテゴリ: ${categoryName} | チャンネル: ${channelName}】\n${memoryText.trim()}`,
        indexing_technique: 'high_quality',
        process_rule: { mode: 'automatic' },
      }),
    });

    console.log('[MemoryDebug] Create document status:', createRes.status);
    const createText = await createRes.text();
    console.log('[MemoryDebug] Create document response text:', createText);

    if (!createRes.ok) {
      console.log('[MemoryDebug] Failed at createRes.ok check');
      return;
    }

    let createData: any;
    try {
      createData = JSON.parse(createText);
    } catch (e) {
      console.log('[MemoryDebug] Failed to parse createData JSON:', e);
      return;
    }

    const documentId = createData?.document?.id;
    console.log('[MemoryDebug] Extracted documentId:', documentId);
    if (!documentId) {
      console.log('[MemoryDebug] documentId is missing');
      return;
    }

    console.log('[MemoryDebug] Fetching metadata fields...');
    const metaListRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/metadata`, {
      headers: {
        Authorization: `Bearer ${datasetApiKey}`,
      },
    });

    console.log('[MemoryDebug] Meta list status:', metaListRes.status);
    const metaListText = await metaListRes.text();
    console.log('[MemoryDebug] Meta list response text:', metaListText);

    if (!metaListRes.ok) {
      console.log('[MemoryDebug] Failed at metaListRes.ok check');
      return;
    }

    let metaListData: any;
    try {
      metaListData = JSON.parse(metaListText);
    } catch (e) {
      console.log('[MemoryDebug] Failed to parse metaListData JSON:', e);
      return;
    }

    const fields: any[] = metaListData?.doc_metadata || [];
    console.log('[MemoryDebug] Found metadata fields count:', fields.length);

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

    console.log('[MemoryDebug] Prepared metadataList to attach:', metadataList);
    if (metadataList.length === 0) {
      console.log('[MemoryDebug] metadataList is empty, skipping metadata attachment');
      return;
    }

    const metaAttachRes = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents/metadata`, {
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

    console.log('[MemoryDebug] Meta attach status:', metaAttachRes.status);
    const metaAttachText = await metaAttachRes.text();
    console.log('[MemoryDebug] Meta attach response text:', metaAttachText);

  } catch (error) {
    console.log('[MemoryDebug] Exception caught in saveLongTermMemory:', error);
    return;
  }
}