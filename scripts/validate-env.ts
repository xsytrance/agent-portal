import { getEnvValidationReport } from '../src/app/lib/config/env';

const report = getEnvValidationReport();

console.log(JSON.stringify(report, null, 2));

if (!report.valid && process.env.NODE_ENV === 'production') {
  process.exit(1);
}
