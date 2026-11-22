import { fetchWeatherAndNotify } from './weather';
import { handleStretchTasks } from './20261122-tasks-client';

export interface Env {
  DISCORD_WEBHOOK_URL: string;
  WEATHER_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const cron = controller.cron;

    if (cron === '0 11 * * *' || cron === '0 22 * * *') {
      // 天気通知などの処理
      await fetchWeatherAndNotify(env);
    } else {
      // ストレッチ通知などの処理（初回登録 ＆ 最終集計通知）
      await handleStretchTasks(env, cron);
    }
  },
};
