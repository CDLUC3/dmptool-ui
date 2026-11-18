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

const fs = require('node:fs');

const advisory = 'GHSA-fc5q-39xc-vjpf';
const expires = '2027-01-17';

const [reportPath, statusArg] = process.argv.slice(2);
const auditStatus = Number(statusArg);

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch {
  console.error('Could not read npm audit JSON report.');
  process.exit(1);
}

if (report.error) {
  console.error('npm audit could not run:', report.error.summary ?? report.error);
  process.exit(1);
}

const expired = new Date().toISOString().slice(0, 10) > expires;
const vulnerabilities = report.vulnerabilities ?? {};
const severity = { low: 0, moderate: 1, high: 2, critical: 3 };

// A finding is allowed only if every advisory it comes from, directly or
// through the packages it depends on, is the allowed advisory.
function chainIsAllowed(name, seen = new Set()) {
  if (seen.has(name)) return false;

  const via = vulnerabilities[name]?.via;
  if (!Array.isArray(via) || via.length === 0) return false;

  const nextSeen = new Set(seen);
  nextSeen.add(name);

  return via.every((item) => {
    if (typeof item === 'string') {
      return chainIsAllowed(item, nextSeen);
    }
    return typeof item?.url === 'string' && item.url.includes(advisory);
  });
}

const highOrCritical = Object.entries(vulnerabilities).filter(
  ([, item]) => (severity[item.severity] ?? 0) >= 2
);

const advisoryPresent = Object.values(vulnerabilities).some((item) =>
  (item.via ?? []).some(
    (entry) =>
      typeof entry !== 'string' &&
      typeof entry?.url === 'string' &&
      entry.url.includes(advisory)
  )
);

const unexpected = highOrCritical
  .filter(([name]) => !chainIsAllowed(name))
  .map(([name]) => name);

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

if (auditStatus !== 0) {
  if (expired && advisoryPresent) {
    console.error(`The exception for ${advisory} expired on ${expires}. Re-check the advisory and update scripts/check-npm-audit.cjs and .trivyignore.yaml.`);
  }
  console.error('npm audit failed. High or critical findings:', expired ? highOrCritical.map(([name]) => name) : unexpected);
  process.exit(1);
}

console.log('npm audit passed.');
