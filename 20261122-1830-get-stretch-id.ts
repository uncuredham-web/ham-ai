async function getStretchListId() {
  const accessToken = '取得したアクセストークンをここに貼り付けてください';

  const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json() as { items?: Array<{ id: string; title: string }> };
  const stretchList = data.items?.find(item => item.title === 'ストレッチ');

  if (stretchList) {
    console.log('ストレッチリストのID:', stretchList.id);
  } else {
    console.log('「ストレッチ」という名前のリストが見つかりませんでした');
  }
}

getStretchListId();