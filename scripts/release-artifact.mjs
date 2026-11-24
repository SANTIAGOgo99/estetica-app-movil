import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { appendFile, readFile, rename, writeFile } from 'node:fs/promises';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { releaseProject } from './release-config.mjs';

export function validatePreviewBuild(raw, sha) {
  const builds = Array.isArray(raw) ? raw : [raw];
  if (builds.length !== 1) throw Error('Se esperaba exactamente una compilación Android');
  const build = builds[0];
  if (build?.status !== 'FINISHED' || build.platform !== 'ANDROID'
    || build.distribution !== 'INTERNAL' || build.buildProfile !== 'preview') throw Error('EAS no confirmó un APK preview finalizado');
  if (!/^[a-f0-9-]{36}$/.test(build.id ?? '') || build.app?.id !== releaseProject.id
    || build.appIdentifier !== releaseProject.androidPackage || build.gitCommitHash !== sha)
    throw Error('El build no corresponde al proyecto, paquete o commit probado');
  const url = new URL(build.artifacts?.buildUrl ?? '');
  if (url.origin !== 'https://expo.dev' || !/^\/artifacts\/eas\/.+\.apk$/.test(url.pathname) || url.search || url.hash)
    throw Error('El artefacto no es una URL APK de Expo válida');
  return {
    id: build.id, status: build.status, platform: build.platform, profile: build.buildProfile,
    distribution: build.distribution, projectId: build.app.id, package: build.appIdentifier,
    commit: build.gitCommitHash, version: build.appVersion, versionCode: build.appBuildVersion,
    completedAt: build.completedAt, downloadUrl: url.href,
    page: `https://expo.dev/accounts/${releaseProject.owner}/projects/${releaseProject.slug}/builds/${build.id}`,
  };
}

export async function downloadApk(url, destination, fetcher = fetch) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(300000) });
  if (!response.ok || !response.body) throw Error(`No se pudo descargar APK: HTTP ${response.status}`);
  const hash = createHash('sha256');
  let bytes = 0;
  let header = new Uint8Array();
  const meter = new Transform({ transform(chunk, _encoding, callback) {
    bytes += chunk.length;
    if (bytes > 512 * 1024 * 1024) return callback(Error('APK supera el límite de descarga de 512 MiB'));
    if (header.length < 4) header = Uint8Array.from([...header, ...chunk.subarray(0, 4 - header.length)]);
    hash.update(chunk);
    callback(null, chunk);
  } });
  await pipeline(Readable.fromWeb(response.body), meter, createWriteStream(`${destination}.part`, { flags: 'wx' }));
  if (header.join(',') !== '80,75,3,4') throw Error('La descarga no tiene cabecera ZIP/APK');
  await rename(`${destination}.part`, destination);
  return { bytes, sha256: hash.digest('hex') };
}

async function record() {
  const dir = 'output/release';
  const source = JSON.parse(await readFile(`${dir}/source.json`, 'utf8'));
  const build = validatePreviewBuild(JSON.parse(await readFile(`${dir}/eas-build.json`, 'utf8')), source.commit);
  const filename = `estetica-clientes-${source.commit.slice(0, 12)}-${build.id}.apk`;
  const apk = { filename, ...await downloadApk(build.downloadUrl, `${dir}/${filename}`) };
  const manifest = { recordedAt: new Date().toISOString(), source, build, apk,
    scope: 'Build FINISHED y SHA-256 de APK descargado. No acredita instalación, aceptación nativa ni verificación criptográfica independiente de firma.' };
  await writeFile(`${dir}/release.json`, JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(`${dir}/SHA256SUMS.txt`, `${apk.sha256}  ${filename}\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `build_page=${build.page}\n`);
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `## APK interno generado\n\nCommit: ${source.commit}\n\n[CI](${source.ciUrl}) · [Build EAS](${build.page})\n\nBuild: ${build.id}\n\nSHA-256: ${apk.sha256}\n\nDescargar APK y release.json en Artifacts. No acredita todavía aceptación en dispositivo.\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await record();
