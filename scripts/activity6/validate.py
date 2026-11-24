"""Comprueba integridad de lotes y cálculos sin emitir datos de usuarios."""
import csv
import hashlib
import json
import math
import os
from pathlib import Path
import re
import statistics
import subprocess
from datetime import datetime, timezone

ROOT = Path.cwd()
OUT = ROOT / os.environ.get("ACTIVITY6_OUT", "docs/evidence/actividad6-rendimiento")


def read(name):
    return json.loads((OUT / name).read_text(encoding="utf-8-sig"))


checks = []


def check(name, condition):
    checks.append({"check": name, "passed": bool(condition)})


api = read("api.json")
web = read("web.json")
native = read("android-derived.json")
summary = read("summary.json")
check("40 solicitudes públicas reales correctas", len(api["samples"]) == 40 and all(r["ok"] and r["status"] == 200 for r in api["samples"]))
check("100 operaciones web reales completadas", len(web["samples"]) == 100 and all(r["ok"] for r in web["samples"]))
check("Sin errores JavaScript ni escrituras reales", not web["pageErrors"] and not web["blocked"] and all(r.get("method", "GET") == "GET" for r in web["network"]))
check("20 lanzamientos nativos observados", len(native["samples"]) == 20 and all(r["processAlive"] for r in native["samples"]))
check("Hash instalado acreditado", native["metadata"]["installedHashVerified"])
expected_hash = native["metadata"]["apkSha256"]
installed = ROOT / "tmp/activity6-installed-base.apk"
released = ROOT / "output/cd-review/release-cd8bb15d/estetica-clientes-35755d883bf1-cd8bb15d-b39e-4c9a-a0be-68dad9cfa0b3.apk"
check("SHA-256 independiente de APK original y base.apk recuperado", all(hashlib.sha256(p.read_bytes()).hexdigest() == expected_hash for p in [installed, released]))

for row in native["samples"]:
    raw = (OUT / f"android-raw-{row['repetition']:02}.log").read_text(encoding="utf-8")
    total = int(re.search(r"TotalTime:\s*(\d+)", raw).group(1))
    pss = int(re.search(r"TOTAL PSS:\s*(\d+)", raw).group(1)) / 1024
    cpu_rows = [line.split() for line in raw.splitlines() if re.match(r"^\s*\d+\s+\S+\s+-?\d+\s+-?\d+", line) and "com.santiagogo99.esteticaclientes" in line]
    check(f"Muestra Android {row['repetition']} coincide con registro original", total == row["totalTimeMs"] and pss == row["pssMiB"] and len(cpu_rows) == 2 and float(cpu_rows[-1][8]) == row["idleCpuOneCorePct"])

with (OUT / "samples.csv").open(encoding="utf-8", newline="") as file:
    samples = list(csv.DictReader(file))
check("CSV completo sin valores ausentes", len(samples) == 295 and all(r["value"] for r in samples))
for s in summary["summaries"]:
    rows = [r for r in samples if r["flow"] == s["flow"]]
    values = sorted(float(r["value"]) for r in rows)
    p95 = values[math.ceil(len(values) * 0.95) - 1]
    within = sum(value < s["budget"] for value in values)
    check(f"Estadística independiente de {s['flow']}", len(values) == s["attempts"] and math.isclose(statistics.mean(values), s["mean"], abs_tol=1e-8) and math.isclose(p95, s["p95"], abs_tol=1e-8) and within == s["withinBudget"] and math.isclose(statistics.pstdev(values), s["sdPopulation"], abs_tol=1e-8))

for name in ["controlled-playwright.json", "existing-playwright.json"]:
    result = read(name)
    check(f"Playwright aprobado {name}", result["stats"]["unexpected"] == 0 and result["stats"]["skipped"] == 0 and not result["errors"])

for name in ["results.png", "p95-budget.png", "android-inicio-apk-liberado.png", "web-inicio.png", "web-services.png", "web-products.png", "web-services-detail.png", "web-products-detail.png", "web-mock-disponibilidad.png"]:
    check(f"PNG válido {name}", (OUT / name).read_bytes().startswith(b"\x89PNG\r\n\x1a\n"))

for name in ["lint", "typecheck", "scriptsLint"]:
    check(f"Control estático {name}", read("local-checks.json")[name]["exitCode"] == 0)

diff = subprocess.run(["git", "diff", "35755d883bf111ab3596c30c2da9520cf7cecde5", "--", "src", "assets", "package.json", "package-lock.json", "app.json", "eas.json", "tests", "playwright.config.ts", ".github"], capture_output=True, check=True)
check("Fuente y workflows liberados sin cambios", not diff.stdout)
refs = subprocess.run(["git", "show-ref", "--heads"], capture_output=True, text=True, check=True).stdout
check("main y develop conservados", "79ad3affa3f36146cfdde5a5a0a6c8c6d6a645b2 refs/heads/main" in refs and "35755d883bf111ab3596c30c2da9520cf7cecde5 refs/heads/develop" in refs)
branch = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True, check=True).stdout.strip()
check("Rama independiente", branch == "codex/actividad6-rendimiento")
phases = read("api-phase-summary.json")
check("Tres fases TCP negativas identificadas y excluidas", next(r for r in phases if r["field"] == "tcpMs")["rejectedNegativeValues"] == 3 and next(r for r in phases if r["field"] == "tcpMs")["n"] == 37)

# Revisar enlaces locales del informe y del índice; omitir URL y anclas externas.
for document in [ROOT / "docs/actividad6-rendimiento.md", OUT / "README.md"]:
    for target in re.findall(r"\]\(([^)]+)\)", document.read_text(encoding="utf-8")):
        if "://" not in target and not target.startswith("#"):
            destination = (document.parent / target).resolve()
            check(f"Enlace local válido {target}", destination.exists() or destination == (OUT / "validation.json").resolve())

report = {"recordedAt": datetime.now(timezone.utc).isoformat(), "checks": checks, "passed": all(r["passed"] for r in checks), "independentChecks": "Python statistics y lectura de logs ADB, CSV, hashes, PNG, referencias Git y códigos de salida. No vuelve a solicitar datos al backend."}
(OUT / "validation.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps({"passed": report["passed"], "checkCount": len(checks), "failed": [r for r in checks if not r["passed"]]}, ensure_ascii=False))
raise SystemExit(0 if report["passed"] else 1)
