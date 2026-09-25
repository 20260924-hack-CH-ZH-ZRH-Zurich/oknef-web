"""Refresh independent surface source copies; no runtime sibling dependencies."""
import hashlib
import json
from pathlib import Path
import re
import shutil

source = Path(__file__).resolve().parents[1]
for name in ("oknef-web-ui-chat", "oknef-web-ui-components", "oknef-web-ui-canvas"):
    destination = source.parent / name
    manifest_path = destination / "source-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    obsolete = "src/features/chat/capture/ImagePreview.tsx"
    if not (source / obsolete).exists() and (destination / obsolete).is_file():
        (destination / obsolete).unlink()
    pending = [item["path"] for item in manifest["files"]]
    pending += [
        "extension-socket.test.ts", "websocketUpgrade.test.ts",
        "src/app/api/[...path]/route.limits.test.ts", "src/lib/mediaLifecycle.test.ts",
        "src/lib/apiRoutes.test.ts", "src/lib/requestLimits.test.ts",
    ]
    if name.endswith("chat"):
        pending += [str(path.relative_to(source)) for path in (source / "src/features/chat").glob("*.ts*")]
        pending += [str(path.relative_to(source)) for path in (source / "src/features/capture").glob("*.test.ts")]
    if name.endswith("canvas"):
        pending += ["src/features/product/Connections.tsx"]
    copied = set()
    while pending:
        relative = pending.pop()
        if relative in copied or not (source / relative).is_file():
            continue
        origin = source / relative
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(origin, target)
        copied.add(relative)
        if origin.suffix not in (".ts", ".tsx", ".js", ".mjs"):
            continue
        for imported in re.findall(r'(?:from\s+|import\s*)["\']([^"\']+)["\']', origin.read_text()):
            if imported.startswith("@/"):
                base = source / "src" / imported[2:]
            elif imported.startswith("."):
                base = origin.parent / imported
            else:
                continue
            suffixes = (".ts", ".tsx", ".js", ".mjs")
            candidates = [base] + [Path(f"{base}{suffix}") for suffix in suffixes]
            candidates += [base / f"index{suffix}" for suffix in suffixes]
            for candidate in candidates:
                if candidate.is_file():
                    pending.append(str(candidate.resolve().relative_to(source)))
                    break
    manifest["files"] = [{"path": path, "sha256": hashlib.sha256((destination / path).read_bytes()).hexdigest()} for path in sorted(copied)]
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{name}: {len(copied)} source files synchronized")
