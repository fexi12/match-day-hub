Add the `observability` block to `wrangler.jsonc` (Cloudflare Workers config). It will sit alongside the existing keys:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "src/server.ts",
  "observability": {
    "enabled": false,
    "head_sampling_rate": 1,
    "logs": {
      "enabled": true,
      "head_sampling_rate": 1,
      "persist": true,
      "invocation_logs": true
    },
    "traces": {
      "enabled": false,
      "persist": true,
      "head_sampling_rate": 1
    }
  }
}
```

Single-file change: `wrangler.jsonc`.