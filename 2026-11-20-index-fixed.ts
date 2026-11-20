export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Weather notification check started...');

    try {
      const apiKey = env.WEATHER_API_KEY;
      const location = env.TARGET_LOCATION || 'Nerima, Tokyo';

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
      const timeRow: string[] = [];
      const emojiRow: string[] = [];

      const getWeatherEmoji = (text: string): string => {
        const lower = text.toLowerCase();
        if (lower.includes('sunny') || lower.includes('clear')) return '☀️';
        if (lower.includes('partly cloudy')) return '⛅';
        if (lower.includes('cloud') || lower.includes('overcast')) return '☁️';
        if (lower.includes('rain') || lower.includes('drizzle')) return '☔';
        if (lower.includes('snow')) return '❄️';
        if (lower.includes('thunder')) return '⚡';
        return '🌡️';
      };

      for (const h of futureHours) {
        if (h.will_it_rain === 1 || (h.chance_of_rain && h.chance_of_rain > 30)) {
          willRain = true;
        }
        
        const timePart = h.time.split(' ')[1];
        const hourStr = timePart.split(':')[0] + '時';
        timeRow.push(hourStr);

        const emoji = getWeatherEmoji(h.condition.text);
        emojiRow.push(emoji);
      }

      const rainNotice = willRain ? '⚠️ 今後12時間以内に雨が降る予報があります。傘をお忘れなく！' : '✨ 今後12時間の降水確率や雨の心配は低めです。';
      
      const tableText = [
        `時刻 | ` + timeRow.join(' | '),
        `天気 | ` + emojiRow.join('  | ')
      ].join('\n');

      const userId = env.DISCORD_USER_ID || '';
      const mention = userId ? `<@${userId}> ` : '';

      const message = `${mention}\n📍 **${location}の今後12時間の天気**\n${rainNotice}\n\n\`\`\`text\n${tableText}\n\`\`\``;

      const webhookUrl = env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('DISCORD_WEBHOOK_URL is not set');
      }

      const discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          allowed_mentions: {
            parse: ['users']
          }
        }),
      });

      if (!discordRes.ok) {
        throw new Error(`Discord Webhook failed: ${discordRes.statusText}`);
      }

      console.log('Weather notification sent successfully!');

    } catch (error) {
      console.error('Error fetching or sending weather:', error);
    }
  },
};