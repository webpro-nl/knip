import { createWeatherClient } from 'weather-client';

export const getWeather = (city: string) => createWeatherClient().getWeather(city);
