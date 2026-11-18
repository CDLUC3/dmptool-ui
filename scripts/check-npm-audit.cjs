// Wraps `npm audit` so the production build accepts one known advisory while
// still failing on any other high or critical finding. npm audit has no
// built-in per-advisory ignore.
//
// GHSA-fc5q-39xc-vjpf (CVE-2026-112366): picomatch ReDoS with no patched
// version. picomatch is only used by @parcel/watcher, the file watcher used by
// next-intl (next dev/build) and sass --watch. It never runs while the app
// serves requests, and the globs it compiles come from config, not users.
//
// The exception expires on the date in `expires` below. After that date the
// advisory is no longer allowed and the build fails again, so someone has to
// re-check whether a patch exists and then remove the exception or extend the
// date. Keep the expiry in sync with `expired_at` in .trivyignore.yaml.
//
// Usage: node scripts/check-npm-audit.cjs <audit-report.json> <npm-audit-exit-code>
//
// Dockerfile.prod runs `npm audit --omit=dev --audit-level=high --json`, saves
// the report to a file, and passes the file path and npm's exit code here.
// With --audit-level=high, npm exits 1 if anything is high or critical, and 0
// otherwise (low and moderate findings are still in the JSON but don't affect
// the exit code).
//
// The report's `vulnerabilities` object is keyed by package name. Each entry's
// `via` array holds two kinds of item:
//   - an object: an advisory filed directly against that package (its `url`
//     ends with the GHSA ID)
//   - a string: the name of a dependency that is itself vulnerable, meaning
//     the package is flagged only because it leads to that dependency
// For this advisory, the report looks roughly like:
//   picomatch:       via: [{ url: ".../GHSA-fc5q-39xc-vjpf", ... }]
//   @parcel/watcher: via: ["picomatch"]
//   next-intl:       via: ["@parcel/watcher"]
//   sass:            via: ["@parcel/watcher"]
//
// The file is .cjs so Node always treats it as CommonJS (`require`), even if
// package.json later gets "type": "module".

const fs = require('node:fs');

const advisory = 'GHSA-fc5q-39xc-vjpf';
const expires = '2027-01-17';

// Read the two arguments. process.argv holds ['node', '<this script>', ...args],
// so process.argv.slice(2) gives just the arguments: the report path and npm
// audit's exit code. Arguments always arrive as strings, so Number(statusArg)
// turns "1" into 1. If the exit code is missing, Number(undefined) is NaN,
// which matches neither 0 nor 1, so the script ends up failing at the last
// check below (`auditStatus !== 0`). That's the safe outcome.
const [reportPath, statusArg] = process.argv.slice(2);
const auditStatus = Number(statusArg);

// Load the report: fs.readFileSync reads the file as text and JSON.parse turns
// it into an object. If the file is missing or isn't valid JSON, either call
// throws, and the catch fails the build. An unreadable report never counts as
// a pass.
let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch {
  console.error('Could not read npm audit JSON report.');
  process.exit(1);
}

// If npm audit couldn't run (for example, it couldn't reach the registry), the
// report is { "error": {...} } with no vulnerabilities. Without this check that
// would look like a clean report. Print npm's own error summary (or the whole
// error object if there's no summary) and fail.
if (report.error) {
  console.error('npm audit could not run:', report.error.summary ?? report.error);
  process.exit(1);
}

// Check the expiry date. new Date().toISOString() gives the current time in UTC,
// like "2026-11-18T17:30:00.000Z", and .slice(0, 10) keeps just "2026-11-18".
// Dates in this format sort correctly as plain strings, so `>` compares them.
// The exception still applies on the `expires` date and stops the day after.
const expired = new Date().toISOString().slice(0, 10) > expires;
// The findings, keyed by package name. `?? {}` means a report with no
// `vulnerabilities` field is treated as having no findings.
const vulnerabilities = report.vulnerabilities ?? {};
// Turns npm's severity words into numbers so they can be compared with >= 2
// (high or above). An unknown severity counts as 0 (see `?? 0` below).
const severity = { low: 0, moderate: 1, high: 2, critical: 3 };

// A finding is allowed only if every advisory it comes from, directly or
// through the packages it depends on, is the allowed advisory.
//
// It looks up the package's `via` list and checks every entry with
// `via.every(...)`. A string entry (a vulnerable dependency) is followed by
// calling this function again on that dependency. An object entry (a direct
// advisory) passes only if its URL contains the allowed GHSA ID.
//
// For next-intl the chain is next-intl -> @parcel/watcher -> picomatch, which
// ends at the allowed advisory, so it's allowed. This is deliberately strict:
// if picomatch also had a different advisory, even a low one, `every()` fails
// and so does the build, so an unknown advisory isn't accepted just because it
// sits next to a known one.
function chainIsAllowed(name, seen = new Set()) {
  // Coming back to a package already on this path means the dependencies form
  // a cycle. Treat it as not allowed rather than looping forever.
  if (seen.has(name)) return false;

  // A package missing from the report, or with nothing in `via`, can't be
  // traced back to the allowed advisory, so it isn't allowed.
  const via = vulnerabilities[name]?.via;
  if (!Array.isArray(via) || via.length === 0) return false;

  // A fresh copy for each path. Two separate paths can reach the same package
  // (next-intl and sass both reach @parcel/watcher), and a shared set would
  // make the second path look like a cycle.
  const nextSeen = new Set(seen);
  nextSeen.add(name);

  return via.every((item) => {
    // A string is a vulnerable dependency: follow it.
    if (typeof item === 'string') {
      return chainIsAllowed(item, nextSeen);
    }
    // An object is a direct advisory: it must be the allowed one.
    return typeof item?.url === 'string' && item.url.includes(advisory);
  });
}

// The packages whose overall severity is high or critical. These are the only
// ones that block the build. Object.entries turns the report into
// [name, entry] pairs, and `([, item])` skips the name and looks at the entry.
const highOrCritical = Object.entries(vulnerabilities).filter(
  ([, item]) => (severity[item.severity] ?? 0) >= 2
);

// Whether the allowed advisory appears in the report at all: true if any
// package has an object entry in `via` whose URL contains the GHSA ID. Once
// picomatch is patched and the advisory disappears, the exception below can't
// apply.
const advisoryPresent = Object.values(vulnerabilities).some((item) =>
  (item.via ?? []).some(
    (entry) =>
      typeof entry !== 'string' &&
      typeof entry?.url === 'string' &&
      entry.url.includes(advisory)
  )
);

// The high or critical packages that don't trace back to the allowed advisory:
// keep the ones chainIsAllowed rejects, then keep just their names. These are
// the real problems, and the names printed when the build fails.
const unexpected = highOrCritical
  .filter(([name]) => !chainIsAllowed(name))
  .map(([name]) => name);

// Pass with the exception only if all of these are true:
//   - the exception hasn't expired
//   - npm reported a high or critical finding (exit 0 needs no exception)
//   - the allowed advisory is actually in the report
//   - there's at least one high or critical finding to allow (a second check
//     on the exit code)
//   - every high or critical finding traces back to the allowed advisory
// If so, print that the advisory is being allowed and exit 0 so the build
// continues.
if (
  !expired &&
  auditStatus === 1 &&
  advisoryPresent &&
  highOrCritical.length > 0 &&
  unexpected.length === 0
) {
  console.log(`npm audit: allowing ${advisory} until ${expires}; no other high or critical findings.`);
  process.exit(0);
}

// The exception didn't apply and npm didn't exit 0, so fail the build. This
// also covers a missing or unexpected exit code. Once the exception has
// expired, nothing is allowed any more, so every high or critical package is
// listed; otherwise just the unexpected ones are. If the exception has expired
// and the advisory is still there, first print a message saying which files
// to update. Exiting 1 fails the Dockerfile RUN step.
if (auditStatus !== 0) {
  if (expired && advisoryPresent) {
    console.error(`The exception for ${advisory} expired on ${expires}. Re-check the advisory and update scripts/check-npm-audit.cjs and .trivyignore.yaml.`);
  }
  console.error('npm audit failed. High or critical findings:', expired ? highOrCritical.map(([name]) => name) : unexpected);
  process.exit(1);
}

// npm exited 0: nothing high or critical was found. This is what will happen
// once picomatch is patched, with no change needed to this script.
console.log('npm audit passed.');
