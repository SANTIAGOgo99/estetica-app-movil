import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'export', '--platform', 'web', '--output-dir', 'dist-test'], { stdio: 'inherit', env: { ...process.env, EXPO_NO_DOTENV: '1', EXPO_PUBLIC_API_URL: 'https://api.example.test/api', CI: '1' } });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
