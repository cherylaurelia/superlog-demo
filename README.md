# Superlog's README quick start never creates an issue

Unofficial demo by Cheryl Aurelia, not affiliated with Superlog.

**Problem.** On superloglabs/superlog 78123ee, the [README quick start](https://github.com/superloglabs/superlog/blob/78123ee/README.md#L86) doesn't apply `infra/clickhouse/migrations`. A fresh install accepts an error span and log with 200 and stores them, but creates 0 issues and 0 incidents, and the worker logs `UNKNOWN_TABLE otel_issue_candidates` every tick.

**Fix.** [fix/quick-start-clickhouse-migrations](https://github.com/superloglabs/superlog/compare/main...cherylaurelia:superlog:fix/quick-start-clickhouse-migrations) adds `pnpm clickhouse:migrate` to the README and CONTRIBUTING quick starts, reusing the script `dev:portless` runs. The same span and log then create 2 issues, one from each, and 1 incident.

**Limits.** Quick start paths only, one test error, Cloud not tested, no agent investigation (needs a model key). `.env.example` files copied by hand and sent to port 4000; open PRs #489 and #397 cover those gaps. Own finding, no user reports.

## Run the page

```bash
npm install && npm run build && npm run start
```

`data/` holds the recorded output, with `runs.json` collapsing the migration lines. To record it again, with Docker running: `scripts/quickstart_run.sh <ref> <out.txt>`, which clones, runs the quick start, sends the error from `scripts/send_error.py`, prints the counts and tears everything down.
