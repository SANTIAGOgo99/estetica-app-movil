import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const adb = process.env.ADB_PATH || 'C:/Users/LENOVO/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const out = resolve(process.env.ACTIVITY6_OUT || 'docs/evidence/actividad6-rendimiento');
mkdirSync(out, { recursive: true });
mkdirSync(resolve('tmp'), { recursive: true });
const protocol = JSON.parse(readFileSync(new URL('./protocol.json', import.meta.url)));
const pkg = 'com.santiagogo99.esteticaclientes';
const component = `${pkg}/.MainActivity`;
const apk = resolve('output/cd-review/release-cd8bb15d/estetica-clientes-35755d883bf1-cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3.apk');
const expectedHash = '0c4152abe89972016a49fd1abf9087dfe9fefec409b70cfc22548259986bdf42';
const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const save = (name, data) => writeFileSync(resolve(out, name), JSON.stringify(data, null, 2) + '\n');
const run = args => spawnSync(adb, args, { encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
const devices = run(['devices']);
const connected = devices.stdout?.split(/\r?\n/).filter(line => /\tdevice$/.test(line)).map(line => line.split('\t')[0]) || [];
if (connected.length !== 1) {
  save('android-status.json', { recordedAt: new Date().toISOString(), adbExitCode: devices.status, authorizedDeviceCount: connected.length, unauthorizedDeviceCount: (devices.stdout?.match(/\tunauthorized/g) || []).length, measured: false, reason: 'Se necesita exactamente un dispositivo de pruebas autorizado. No se guardan números de serie.' });
  console.log('Android pendiente: se requiere un dispositivo autorizado.');
  process.exit(2);
}
const target = args => run(['-s', connected[0], ...args]);
const shell = (...args) => target(['shell', ...args]);
if (hash(apk) !== expectedHash) throw Error('El APK local no coincide con la liberación de Actividad 5.');
let packagePath = shell('pm', 'path', pkg).stdout.trim().replace(/^package:/, '').split(/\r?\n/)[0];
let installedMatches = false;
const pulled = resolve('tmp/activity6-installed-base.apk');
if (packagePath.startsWith('/')) {
  const r = target(['pull', packagePath, pulled]);
  if (r.status === 0) installedMatches = hash(pulled) === expectedHash;
}
if (!installedMatches) {
  if (!process.argv.includes('--install-released')) throw Error('APK instalado ausente o distinto. Ejecutar --install-released para instalar exactamente el APK publicado, conservando datos; nunca se desinstala ni borra información.');
  const installed = target(['install', '-r', apk]);
  if (installed.status !== 0 || !installed.stdout.includes('Success')) throw Error('No se pudo instalar el APK liberado; no se desinstalará la app existente.');
  packagePath = shell('pm', 'path', pkg).stdout.trim().replace(/^package:/, '').split(/\r?\n/)[0];
  const r = target(['pull', packagePath, pulled]);
  if (r.status !== 0 || hash(pulled) !== expectedHash) throw Error('No se acreditó el hash del APK instalado.');
}
const metadata = {
  recordedAt: new Date().toISOString(), commit: protocol.releasedCommit, apkSha256: expectedHash, installedHashVerified: true,
  model: shell('getprop', 'ro.product.model').stdout.trim(), android: shell('getprop', 'ro.build.version.release').stdout.trim(), sdk: shell('getprop', 'ro.build.version.sdk').stdout.trim(),
  battery: shell('dumpsys', 'battery').stdout, display: shell('wm', 'size').stdout,
  version: shell('dumpsys', 'package', pkg).stdout.split(/\r?\n/).filter(line => /versionCode=|versionName=/.test(line)).join('\n'),
  scope: 'am start mide espera reportada por Activity Manager, no asegura contenido React listo. Force-stop enfría el proceso; no elimina cachés de disco ni datos. Memoria y CPU son muestras en reposo tras 5 s; CPU top usa la segunda actualización de intervalo 1 s. No se realiza login ni operaciones productivas.',
};
const samples = [];
for (let repetition = 1; repetition <= protocol.samplesPerFlow; repetition++) {
  shell('am', 'force-stop', pkg);
  const start = shell('am', 'start', '-W', '-n', component);
  await new Promise(done => setTimeout(done, 5000));
  const pid = shell('pidof', pkg).stdout.trim().split(' ')[0];
  const memory = shell('dumpsys', 'meminfo', pkg);
  const cpu = /^\d+$/.test(pid) ? shell('top', '-b', '-n', '2', '-d', '1', '-p', pid) : { stdout: '', status: null };
  const pssKiB = Number(memory.stdout.match(/TOTAL PSS:\s*(\d+)/)?.[1] || memory.stdout.match(/^\s*TOTAL\s+(\d+)/m)?.[1]) || null;
  const lines = cpu.stdout.replace(/S\[%CPU\]/g, 'S %CPU').split(/\r?\n/).map(line => line.trim().split(/\s+/));
  let cpuIndex = -1;
  const cpuValues = [];
  for (const columns of lines) {
    if (columns.includes('PID')) cpuIndex = columns.indexOf('%CPU');
    else if (columns[0] === pid && cpuIndex >= 0 && Number.isFinite(Number(columns[cpuIndex]))) cpuValues.push(Number(columns[cpuIndex]));
  }
  const row = { repetition, recordedAt: new Date().toISOString(), launchStatus: start.status, totalTimeMs: Number(start.stdout.match(/TotalTime:\s*(\d+)/)?.[1]) || null, waitTimeMs: Number(start.stdout.match(/WaitTime:\s*(\d+)/)?.[1]) || null, processAlive: /^\d+$/.test(pid), pssMiB: pssKiB === null ? null : pssKiB / 1024, idleCpuOneCorePct: cpuValues.length >= 2 ? cpuValues.at(-1) : null };
  samples.push(row);
  writeFileSync(resolve(out, `android-raw-${String(repetition).padStart(2, '0')}.log`), `LAUNCH\n${start.stdout}\nMEMORY\n${memory.stdout}\nCPU\n${cpu.stdout}`);
  save('android.json', { metadata, protocol, samples });
  console.log(JSON.stringify(row));
}
const exitInfo = shell('dumpsys', 'activity', 'exit-info', pkg).stdout;
// Conservar solo razones y fechas de salida, evitando trazas y cualquier dato de usuario.
writeFileSync(resolve(out, 'android-exit-reasons.log'), exitInfo.split(/\r?\n/).filter(line => /timestamp=|reason=|status=|description=/.test(line)).join('\n') + '\n');
save('android-status.json', { recordedAt: new Date().toISOString(), measured: true, samples: samples.length, installedHashVerified: true, stabilityScope: 'Procesos vivos al final de cada arranque; consultar exit-reasons y distinguir salidas force-stop del protocolo de crashes/ANR. No constituye una prueba prolongada de estabilidad.' });
