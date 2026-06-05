import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src/lib/weather.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = path.join(os.tmpdir(), `weather-${Date.now()}.mjs`);
fs.writeFileSync(tmp, transpiled);
const mod = await import(`file://${tmp}`);

const request = mod.buildWeatherRequest("2026-06-13", "19:30", "2026-06-01");
assert.equal(
  request.hourly,
  true,
  "weather request uses hourly forecast for kickoff-specific weather",
);
const requestUrl = decodeURIComponent(request.url);
assert.match(
  requestUrl,
  /hourly=temperature_2m,weather_code,precipitation/,
  "weather request asks Open-Meteo for hourly temperature, condition and rain",
);
assert.match(
  requestUrl,
  /start_date=2026-06-13&end_date=2026-06-13/,
  "weather request is tied to the selected match date",
);
assert.match(requestUrl, /forecast/, "future match dates use the forecast API");

const archived = mod.buildWeatherRequest("2026-05-20", "11:00", "2026-06-01");
assert.match(archived.url, /archive-api/, "past match dates use the historical archive API");

const weather = mod.pickKickoffWeather(
  {
    hourly: {
      time: ["2026-06-13T18:00", "2026-06-13T19:00", "2026-06-13T20:00"],
      temperature_2m: [18.2, 17.6, 16.9],
      weather_code: [1, 61, 3],
      precipitation: [0, 1.4, 0.2],
    },
  },
  "2026-06-13",
  "19:30",
);
assert.deepEqual(
  weather,
  {
    temperature: 18,
    weatherCode: 61,
    precipitation: 1.4,
    time: "19:00",
  },
  "weather picks the nearest hourly row to the selected kickoff time",
);

console.log("weather logic ok");
