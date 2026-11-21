import fs from 'fs/promises';

async function exportDifyDocuments() {
  const datasetId = 'YOUR_DATASET_ID';
  const apiKey = 'YOUR_DIFY_API_KEY';
  const baseUrl = 'https://api.dify.ai/v1';

  try {
    console.log('ドキュメント一覧を取得中...');
    const res = await fetch(`${baseUrl}/datasets/${datasetId}/documents?page=1&limit=100`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.error('一覧の取得に失敗しました:', await res.text());
      return;
    }

    const data: any = await res.json();
    const documents = data.data || [];
    console.log(`全 ${documents.length} 件のドキュメントが見つかりました。`);

    for (const doc of documents) {
      console.log(`取得中: ${doc.name} (ID: ${doc.id})`);
      const detailRes = await fetch(`${baseUrl}/datasets/${datasetId}/documents/${doc.id}/upload-file`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      let content = '';
      if (detailRes.ok) {
        const detailData: any = await detailRes.json().catch(() => null);
        content = detailData?.text || '（テキストの取得に失敗または該当データなし）';
      } else {
        content = '（コンテンツ取得エラー）';
      }

      const safeFileName = doc.name.replace(/[\\/:*?"<>|]/g, '_');
      await fs.writeFile(`${safeFileName}.txt`, `【ファイル名】${doc.name}\n\n${content}`, 'utf-8');
    }

    console.log('すべてのドキュメントのテキストファイル出力が完了しました！');
  } catch (error)  {
    console.error('エラーが発生しました:', error);
  }
}

exportDifyDocuments();
