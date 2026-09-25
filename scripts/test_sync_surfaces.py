"""Verify independent runtime copies and narrowly scoped obsolete-file cleanup."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class SurfaceSyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "oknef-web"
        self.source.mkdir()
        script = self.source / "scripts/sync-surfaces.py"
        script.parent.mkdir()
        shutil.copyfile(Path(__file__).with_name("sync-surfaces.py"), script)
        self.script = script
        self.destinations = [
            self.root / f"oknef-web-ui-{kind}"
            for kind in ("chat", "components", "canvas")
        ]
        for destination in self.destinations:
            destination.mkdir()

    def write(self, relative, content):
        target = self.source / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)

    def run_sync(self, paths):
        for destination in self.destinations:
            (destination / "source-manifest.json").write_text(json.dumps({
                "source": "oknef-web", "format": 1,
                "files": [{"path": path, "sha256": "outdated"} for path in paths],
            }))
        subprocess.run(["python3", str(self.script)], check=True, capture_output=True)

    def test_copies_transitive_runtime_imports_and_matching_tests(self):
        self.write("server.mjs", 'import { gateway } from "./extension-socket.mjs";\n')
        self.write("extension-socket.mjs", 'export { gateway } from "./runtime/gateway.js";\n')
        self.write("runtime/gateway.js", "export const gateway = true;\n")
        self.write("extension-socket.test.ts", 'import { gateway } from "./extension-socket.mjs";\n')
        self.write("websocketUpgrade.test.ts", 'import "./websocketUpgrade.mjs";\n')
        self.write("websocketUpgrade.mjs", "export const upgrade = true;\n")
        self.run_sync(["server.mjs"])
        expected = {
            "server.mjs", "extension-socket.mjs", "runtime/gateway.js",
            "extension-socket.test.ts", "websocketUpgrade.test.ts", "websocketUpgrade.mjs",
        }
        for destination in self.destinations:
            manifest = json.loads((destination / "source-manifest.json").read_text())
            self.assertEqual({item["path"] for item in manifest["files"]}, expected)
            for item in manifest["files"]:
                copied = (destination / item["path"]).read_bytes()
                self.assertEqual(copied, (self.source / item["path"]).read_bytes())
                self.assertEqual(item["sha256"], hashlib.sha256(copied).hexdigest())

    def test_removes_only_the_known_obsolete_preview(self):
        obsolete = "src/features/chat/capture/ImagePreview.tsx"
        preserved = "src/features/chat/capture/LocalNotes.tsx"
        for destination in self.destinations:
            for relative in (obsolete, preserved):
                target = destination / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("local copy")
        self.run_sync([obsolete, preserved])
        for destination in self.destinations:
            self.assertFalse((destination / obsolete).exists())
            self.assertEqual((destination / preserved).read_text(), "local copy")
            self.assertEqual(json.loads((destination / "source-manifest.json").read_text())["files"], [])


if __name__ == "__main__":
    unittest.main()
