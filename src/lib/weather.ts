export type WeatherData = {
  temperature: number;
  weatherCode: number;
  precipitation: number;
  time: string;
};

export type OpenMeteoHourlyResponse = {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    weathercode?: number[];
    precipitation?: number[];
  };
};

const PORTO_LAT = 41.1579;
const PORTO_LON = -8.6291;

const cleanKickoff = (kickoff: string) => (/^\d{2}:\d{2}$/.test(kickoff) ? kickoff : "12:00");

export const buildWeatherRequest = (
  date: string,
  kickoff: string,
  today = new Date().toISOString().split("T")[0],
) => {
  const isPast = date < today;
  const base = isPast
    ? "https://archive-api.open-meteo.com/v1/archive"
    : "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: String(PORTO_LAT),
    longitude: String(PORTO_LON),
    hourly: "temperature_2m,weather_code,precipitation",
    timezone: "Europe/Lisbon",
    start_date: date,
    end_date: date,
  });

  return {
    hourly: true,
    kickoff: cleanKickoff(kickoff),
    url: `${base}?${params.toString()}`,
  };
};

const minutesFromTime = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

export const pickKickoffWeather = (
  data: OpenMeteoHourlyResponse,
  date: string,
  kickoff: string,
): WeatherData | null => {
  const hourly = data.hourly;
  if (!hourly?.time?.length || !hourly.temperature_2m?.length) return null;

  const codes = hourly.weather_code ?? hourly.weathercode ?? [];
  const rain = hourly.precipitation ?? [];
  const target = minutesFromTime(cleanKickoff(kickoff));

  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  hourly.time.forEach((timestamp, index) => {
    if (!timestamp.startsWith(`${date}T`)) return;
    const hour = timestamp.split("T")[1]?.slice(0, 5);
    if (!hour) return;
    const distance = Math.abs(minutesFromTime(hour) - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  if (bestIndex < 0) return null;

  return {
    temperature: Math.round(hourly.temperature_2m[bestIndex]),
    weatherCode: codes[bestIndex] ?? 0,
    precipitation: rain[bestIndex] ?? 0,
    time: hourly.time[bestIndex].split("T")[1]?.slice(0, 5) ?? cleanKickoff(kickoff),
  };
};
