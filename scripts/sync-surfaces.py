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
    pending = [item["path"] for item in manifest["files"]]
    pending += ["src/app/api/[...path]/route.limits.test.ts", "src/lib/mediaLifecycle.test.ts"]
    if name.endswith("chat"):
        pending += [str(path.relative_to(source)) for path in (source / "src/features/chat").glob("*.ts*")]
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
        if origin.suffix not in (".ts", ".tsx"):
            continue
        for imported in re.findall(r'(?:from\s+|import\s*)["\']([^"\']+)["\']', origin.read_text()):
            if imported.startswith("@/"):
                base = source / "src" / imported[2:]
            elif imported.startswith("."):
                base = origin.parent / imported
            else:
                continue
            for candidate in [base, Path(f"{base}.ts"), Path(f"{base}.tsx"), base / "index.ts", base / "index.tsx"]:
                if candidate.is_file():
                    pending.append(str(candidate.resolve().relative_to(source)))
                    break
    manifest["files"] = [{"path": path, "sha256": hashlib.sha256((destination / path).read_bytes()).hexdigest()} for path in sorted(copied)]
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"{name}: {len(copied)} source files synchronized")
