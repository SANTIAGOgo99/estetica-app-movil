"""Empaqueta únicamente informe, evidencia revisada y scripts, sin APK ni secretos."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import zipfile

root = Path.cwd()
evidence = root / "docs/evidence/actividad6-rendimiento"
report = root / "docs/actividad6-rendimiento.md"
scripts = root / "scripts/activity6"
destination = root / "output/actividad6"
destination.mkdir(parents=True, exist_ok=True)
sources = [root / ".gitattributes", report, *sorted(p for p in scripts.glob("*") if p.is_file())]
provenance = {
    "recordedAt": datetime.now(timezone.utc).isoformat(),
    "files": [{"path": p.relative_to(root).as_posix(), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in sources],
    "scope": "Código de medición e informe final; el manifiesto SHA256SUMS de evidencia incluye los datos y capturas.",
}
(evidence / "report-and-scripts-integrity.json").write_text(json.dumps(provenance, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
files = sorted(p for p in evidence.glob("*") if p.is_file() and p.name != "SHA256SUMS.txt")
(evidence / "SHA256SUMS.txt").write_text("".join(f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n" for p in files), encoding="utf-8")
archive = destination / "Actividad6_informe_y_evidencias.zip"
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
    for path in [*sources, *sorted(p for p in evidence.glob("*") if p.is_file())]:
        bundle.write(path, path.relative_to(root))
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    archived = bundle.namelist()
    assert not any(name.endswith((".apk", ".env", ".jks", ".key")) for name in archived)
    assert len(archived) == len(set(archived))
result = {"recordedAt": datetime.now(timezone.utc).isoformat(), "archive": archive.relative_to(root).as_posix(), "bytes": archive.stat().st_size, "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(), "fileCount": len(archived), "zipIntegrityPassed": True}
(destination / "package.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result))
