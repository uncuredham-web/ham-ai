export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Weather notification check started...');

    try {
      const apiKey = env.WEATHER_API_KEY;
      const location = env.TARGET_LOCATION || 'Nerima, Tokyo';
      const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
      const userId = env.DISCORD_USER_ID; // はむさんのDiscordユーザーID

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

      for (const h of futureHours) {
        if (h.will_it_rain === 1 || (h.chance_of_rain && h.chance_of_rain > 30)) {
          willRain = true;
        }
        conditions.push(`${h.time.split(' ')[1]}: ${h.condition.text}`);
      }

      const rainNotice = willRain ? '⚠️ 今後12時間以内に雨が降る予報があります。傘をお忘れなく！' : '✨ 今後12時間の降水率は低めです。';
      const mention = userId ? `<@${userId}> ` : '';
      const message = `${mention}${location}の今後12時間の天気まとめ\n${rainNotice}\n\n【詳細】\n` + conditions.join('\n');

      if (discordWebhookUrl) {
        await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: message })
        });
      }

      console.log(message);

    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  },
};