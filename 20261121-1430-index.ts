import { Hono } from 'hono';

const app = new Hono();

// 既存のエンドポイント等の定義...

// 隠しエクスポートエンドポイント
app.get('/export-documents', async (c) => {
  const datasetId = c.env.DIFY_DATASET_ID;
  const datasetApiKey = c.env.DIFY_DATASET_API_KEY;

  if (!datasetId || !datasetApiKey) {
    return c.text('Dataset ID or API Key is missing in secrets.', 500);
  }

  try {
    // Difyからドキュメント一覧を取得（ページネーションが必要な場合は適宜拡張）
    const res = await fetch(`https://api.dify.ai/v1/datasets/${datasetId}/documents?limit=100`, {
      headers: {
        Authorization: `Bearer ${datasetApiKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return c.text(`Failed to fetch documents from Dify: ${errText}`, res.status);
    }

    const data: any = await res.json();
    const documents = data?.data || [];

    // 各ドキュメントの詳細（テキスト内容）を取得してまとめる
    const exportedDocs = [];
    for (const doc of documents) {
      // 必要に応じてドキュメントごとの詳細APIを叩くか、一覧に含まれる情報を整形
      exportedDocs.push({
        id: doc.id,
        name: doc.name,
        created_at: doc.created_at,
        // textプロパティが含まれない場合はここで個別取得を追加します
      });
    }

    return c.json({
      total: documents.length,
      documents: exportedDocs,
    });
  } catch (error: any) {
    return c.text(`Error: ${error.message}`, 500);
  });
});

export default app;
