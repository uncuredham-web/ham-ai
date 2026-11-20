export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Weather notification check started...');

    try {
      const apiKey = env.WEATHER_API_KEY;
      const location = env.TARGET_LOCATION || 'Nerima, Tokyo';
      const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
      const discordUserId = env.DISCORD_USER_ID; // ユーザーIDを環境変数から取得（または直接指定）

      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(location)}&days=2&aqi=no&alerts=no`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`WeatherAPI request failed: ${response.statusText}`);
      }

      const data: WeatherResponse = await response.json();
      const hours = data.forecast.forecastday.flatMap(day => day.hour);
      
      const nowEpoch = Math.floor(Date.now() / 1000);
      const futureHours = hours.filter(h => h.time_epoch >= nowEpoch).slice(0, 12);

      let willRain = false;
      const conditions: string[] = [];

      // 英語の天気テキストを日本語に簡易変換する辞書
      const weatherTranslation: Record<string, string> = {
        'Clear': '快晴',
        'Sunny': '晴れ',
        'Partly cloudy': '晴れ時々曇り',
        'Cloudy': '曇り',
        'Overcast': '厚い雲',
        'Mist': '霧',
        'Patchy rain possible': '小雨の可能性',
        'Light rain': '小雨',
        'Moderate rain': '雨',
        'Heavy rain': '大雨',
        'Smoky haze': '煙霧（もや）',
        // 必要に応じて追加
      };

      for (const h of futureHours) {
        if (h.will_it_rain === 1 || (h.chance_of_rain && h.chance_of_rain > 30)) {
          willRain = true;
        }
        // 時刻を「20:00」から「20時」に変換
        const timePart = h.time.split(' ')[1]; // 20:00
        const hourNum = timePart.split(':')[0]; // 20
        const formattedTime = `${parseInt(hourNum, 10)}時`;

        const rawCondition = h.condition.text;
        const translatedCondition = weatherTranslation[rawCondition] || rawCondition;

        conditions.push(`${formattedTime}: ${translatedCondition}`);
      }

      const rainNotice = willRain ? '⚠️ 今後12時間以内に雨が降る予報があります。傘をお忘れなく！' : '✨ 今後12時間の降水確率はずっと低めです。';
      
      // メンションの構築（環境変数にユーザーIDがある場合）
      const mentionPrefix = discordUserId ? `<@${discordUserId}>\n` : '';

      const message = `${mentionPrefix}${location}の今後12時間の天気まとめ\n${rainNotice}\n\n【詳細】\n` + conditions.join('\n');

      // DiscordへPOST送信
      if (discordWebhookUrl) {
        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message,
            allowed_mentions: { parse: ['users'] }
          })
        });
      }

      console.log('Weather notification sent successfully.');

    } catch (error) {
      console.error('Error fetching or sending weather:', error);
    }
  },
};