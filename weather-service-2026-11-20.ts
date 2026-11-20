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

export async function get12HoursWeather(apiKey: string