interface WeatherResponse {
  forecast: {
    forecastday: Array<{
      hour: Array<{
        time_epoch: number;
        time: string;
        condition: {
          text: string;
        };
        chance_of_rain?: number;
        will_it_rain?: number;
      }>;
    }>;
  };
}

export interface Env {
  WEATHER_API_KEY: string;
  TARGET_LOCATION: string;
}

export default {
  async scheduled(controller: ScheduledController