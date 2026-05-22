import { useEffect, useState } from "react";
import { CloudSun, Cloud, CloudRain, CloudSnow, Wind, Droplets, Thermometer } from "lucide-react";
import { useMatch } from "@/lib/match-store";

export type WeatherData = {
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitation: number;
};

// WMO weather code → label + icon
const WMO_CODES: Record<number, { label: string; Icon: typeof CloudSun }> = {
  0: { label: "Clear", Icon: CloudSun },
  1: { label: "Mostly Clear", Icon: CloudSun },
  2: { label: "Partly Cloudy", Icon: Cloud },
  3: { label: "Overcast", Icon: Cloud },
  45: { label: "Foggy", Icon: Cloud },
  48: { label: "Rime Fog", Icon: Cloud },
  51: { label: "Light Drizzle", Icon: CloudRain },
  53: { label: "Drizzle", Icon: CloudRain },
  55: { label: "Heavy Drizzle", Icon: CloudRain },
  61: { label: "Light Rain", Icon: CloudRain },
  63: { label: "Rain", Icon: CloudRain },
  65: { label: "Heavy Rain", Icon: CloudRain },
  71: { label: "Light Snow", Icon: CloudSnow },
  73: { label: "Snow", Icon: CloudSnow },
  75: { label: "Heavy Snow", Icon: CloudSnow },
  80: { label: "Rain Showers", Icon: CloudRain },
  81: { label: "Rain Showers", Icon: CloudRain },
  82: { label: "Violent Showers", Icon: CloudRain },
  95: { label: "Thunderstorm", Icon: CloudRain },
  96: { label: "Thunderstorm", Icon: CloudRain },
  99: { label: "Thunderstorm", Icon: CloudRain },
};

function getWeatherInfo(code: number) {
  // Find closest match — if code not in table, use Cloud as fallback
  if (WMO_CODES[code]) return WMO_CODES[code];
  const base = Math.floor(code / 10) * 10;
  return WMO_CODES[base] ?? { label: "Unknown", Icon: Cloud };
}

async function fetchWeather(date: string): Promise<WeatherData | null> {
  // Porto: R. de Alves Redol 292, 4050-042 Porto
  const lat = 41.1579;
  const lon = -8.6291;

  const today = new Date().toISOString().split("T")[0];
  const isPast = date < today;
  const base = isPast
    ? "https://archive-api.open-meteo.com/v1/archive"
    : "https://api.open-meteo.com/v1/forecast";

  try {
    const url = `${base}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto&start_date=${date}&end_date=${date}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.daily) return null;

    const { daily } = data;
    const i = 0; // first (and only) day
    return {
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      weatherCode: daily.weathercode[i],
      precipitation: daily.precipitation_sum[i],
    };
  } catch {
    return null;
  }
}

export function Weather() {
  const { match } = useMatch();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!match.match_date) return;
    setLoading(true);
    setWeather(null);
    fetchWeather(match.match_date).then((w) => {
      setWeather(w);
      setLoading(false);
    });
  }, [match.match_date]);

  if (!match.match_date) return null;

  const { label, Icon } = getWeatherInfo(weather?.weatherCode ?? 0);

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <CloudSun className="h-6 w-6 text-accent" strokeWidth={1.5} />
          <h3 className="text-xl font-display tracking-wider">Matchday Weather</h3>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading weather…</p>
        ) : weather ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
            <WeatherCard
              icon={Thermometer}
              label="High"
              value={`${weather.tempMax}°C`}
            />
            <WeatherCard
              icon={Thermometer}
              label="Low"
              value={`${weather.tempMin}°C`}
            />
            <WeatherCard
              icon={Icon}
              label="Condition"
              value={label}
            />
            <WeatherCard
              icon={Droplets}
              label="Precipitation"
              value={`${weather.precipitation.toFixed(1)} mm`}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Weather data unavailable for {match.match_date}.
          </p>
        )}
      </div>
    </section>
  );
}

function WeatherCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CloudSun;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-background p-6 flex flex-col gap-3">
      <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
      <p className="text-xs tracking-[0.25em] text-muted-foreground">{label.toUpperCase()}</p>
      <p className="text-lg font-semibold leading-snug">{value}</p>
    </div>
  );
}