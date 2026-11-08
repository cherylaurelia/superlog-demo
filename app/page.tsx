import runs from "../data/runs.json";

const BASE = "78123ee";
const BRANCH_URL = "https://github.com/superloglabs/superlog/compare/main...cherylaurelia:superlog:fix/quick-start-clickhouse-migrations";
const REPO_URL = "https://github.com/cherylaurelia/superlog-demo";
const sourceUrl = (path: string, line: number) => `https://github.com/superloglabs/superlog/blob/${BASE}/${path}#L${line}`;

const results = [
  { label: "Spans and logs stored", before: "1 and 1", after: "1 and 1" },
  { label: "Issues", before: "0", after: "2" },
  { label: "Incidents", before: "0", after: "1" },
  { label: "Worker UNKNOWN_TABLE lines, about 1 min", before: "34", after: "0" },
];

function Run({ title, text }: { title: string; text: string }) {
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-line">
      <figcaption className="border-b border-line bg-surface px-4 py-2 text-[13px] font-medium text-muted">{title}</figcaption>
      <pre tabIndex={0} className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap break-words">
        {text}
      </pre>
    </figure>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl border-x border-line">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-5 sm:px-10">
        <p className="font-medium">Superlog quick start</p>
        <p className="text-[13px] text-muted">Unofficial demo · tested on main {BASE}</p>
      </header>

      <section className="border-b border-line px-5 py-14 sm:px-10 sm:py-20">
        <h1 className="max-w-3xl text-4xl leading-[1.12] font-medium tracking-tight sm:text-5xl">
          <span className="text-muted">The README quick start accepts your errors and </span>
          <span>never creates an issue.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-xl leading-relaxed text-muted">
          <span>It skips the ClickHouse migrations. Adding </span>
          <code className="font-mono text-[0.9em] text-fg">pnpm clickhouse:migrate</code>
          <span> takes the same error span and log from 0 issues to 2, one from each.</span>
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          A clean clone also needs the .env copies and port change that open PRs #489 and #397 cover. This adds the missing step.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className="rounded-full bg-fg px-5 py-2.5 font-medium text-bg hover:bg-white" href={BRANCH_URL}>See the branch</a>
          <a className="rounded-full border border-line px-5 py-2.5 font-medium hover:border-fg" href={REPO_URL}>Demo repo and scripts</a>
        </div>
      </section>

      <section aria-labelledby="result" className="border-b border-line px-5 py-12 sm:px-10">
        <h2 id="result" className="text-2xl font-medium">Same error, two fresh clones</h2>
        <p className="mt-2 max-w-3xl text-muted">
          Each run: new clone, .env files copied, README steps, default compose project, db:seed for an API key, one error
          span and one ERROR log sent to port 4000, then 40 seconds of waiting. Counts come straight from ClickHouse and Postgres.
        </p>
        <div tabIndex={0} className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface text-[13px] text-muted">
              <tr>
                <th scope="col" className="px-3 py-3 font-medium sm:px-4">Result</th>
                <th scope="col" className="px-3 py-3 font-medium sm:px-4">Before</th>
                <th scope="col" className="px-3 py-3 font-medium sm:px-4">After</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.label} className="border-t border-line">
                  <th scope="row" className="px-3 py-3 font-normal text-muted sm:px-4">{row.label}</th>
                  <td className="px-3 py-3 font-mono sm:px-4">{row.before}</td>
                  <td className="px-3 py-3 font-mono sm:px-4 text-accent">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:items-start">
          <Run title={`Before: main ${BASE}`} text={runs.before} />
          <Run title="After: fix/quick-start-clickhouse-migrations" text={runs.after} />
        </div>
      </section>

      <section className="grid gap-10 border-b border-line px-5 py-12 sm:px-10 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-medium">Why it's easy to miss</h2>
          <p className="mt-3 leading-relaxed text-muted">
            <span>Ingest answers 200 and the data is stored, so the stack looks healthy. New issues are read from </span>
            <a className="text-accent underline" href={sourceUrl("apps/worker/src/telemetry/ingest.ts", 657)}>otel_issue_candidates</a>
            <span>, which only </span>
            <a className="text-accent underline" href={sourceUrl("infra/clickhouse/migrations/008_otel_issue_candidates.sql", 1)}>a ClickHouse migration</a>
            <span> creates, and the </span>
            <a className="text-accent underline" href={sourceUrl("README.md", 86)}>README</a>
            <span> never runs those. The one signal is an error in the worker&apos;s log. In a separate run, an error sent before migrating did not come back afterwards.</span>
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-medium">The change</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted">
            <li>One new line in each of the README and CONTRIBUTING quick starts, a row in the CONTRIBUTING commands table, and one package script.</li>
            <li>It reuses <a className="text-accent underline" href={sourceUrl("scripts/portless-stack.sh", 351)}>the script dev:portless already runs</a>, so no new migration logic.</li>
            <li>That script no longer requires SUPERLOG_COMPOSE_PROJECT. Unset, it uses compose&apos;s default project.</li>
            <li>A second run applies nothing. Their test script gains two cases, variable set and unset, and fails if the change is reverted or inverted. CI doesn&apos;t run that script today.</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="limits" className="border-b border-line px-5 py-12 sm:px-10">
        <h2 id="limits" className="text-2xl font-medium">Scope and limits</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 leading-relaxed text-muted">
          <li>This is the README quick start with <code className="font-mono text-sm">pnpm dev</code>. I couldn&apos;t test Cloud, and nothing here suggests it is affected.</li>
          <li>The CONTRIBUTING quick start has the same gap. <code className="font-mono text-sm">dev:portless</code> calls this script, but I only read that path and did not run it.</li>
          <li>This is my own finding from one test error, on commit {BASE}. I found no user reports.</li>
          <li>No agent investigation ran, because that needs a model key. The test stops at the issue and incident rows.</li>
          <li>A follow-up could remove the silent part entirely, with the worker or <code className="font-mono text-sm">pnpm dev</code> saying the migrations are missing. A docs step only helps people who run it.</li>
        </ul>
      </section>

      <footer className="px-5 py-8 text-sm text-muted sm:px-10">
        Unofficial demo by Cheryl Aurelia: not affiliated with Superlog.
      </footer>
    </main>
  );
}
