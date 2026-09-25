import assert from "node:assert/strict";
export async function verifyEvidenceStorage(browser, config) {
  const bundle = process.env.QA_EVIDENCE_BUNDLE;
  if (!bundle)
    throw new Error("QA_EVIDENCE_BUNDLE is required for storage regression");
  // This isolated context tests the actual bundled storage module. The product UI context keeps CSP enforced.
  const context = await browser.newContext({
    baseURL: config.base,
    bypassCSP: true,
  });
  const pages = await Promise.all([context.newPage(), context.newPage()]);
  for (const page of pages) {
    await page.goto("/login");
    await page.addScriptTag({ path: bundle });
  }
  const scope = `storage-regression-${Date.now()}`;
  const create = (page, prefix) =>
    page.evaluate(
      async ({ scope, prefix }) => {
        const store = globalThis.oknefStore;
        await Promise.all(
          Array.from({ length: 8 }, async (_, i) => {
            const file = new File(
              [`${prefix}-${i}-plaintext`],
              `${prefix}-${i}.txt`,
              { type: "text/plain" },
            );
            await store.retainEvidence(
              scope,
              `${prefix}-${i}`,
              file,
              await store.fingerprint(file, "upload"),
            );
          }),
        );
      },
      { scope, prefix },
    );
  await Promise.all([create(pages[0], "first"), create(pages[1], "second")]);
  const results = await pages[0].evaluate(async (scope) => {
    const store = globalThis.oknefStore;
    const files = await store.listEvidence(scope);
    const roundtrips = await Promise.all(
      files.map(async (item) =>
        (await store.originalEvidence(scope, item)).text(),
      ),
    );
    const noPlaintext = files.every(
      (item) =>
        !new TextDecoder().decode(item.ciphertext).includes("plaintext"),
    );
    let rejected = false;
    try {
      await store.originalEvidence("another-scope", files[0]);
    } catch {
      rejected = true;
    }
    const tampered = {
      ...files[0],
      ciphertext: new Uint8Array(files[0].ciphertext).map((byte, index) =>
        index === 0 ? byte ^ 1 : byte,
      ).buffer,
    };
    let tamperRejected = false;
    try {
      await store.originalEvidence(scope, tampered);
    } catch {
      tamperRejected = true;
    }
    return {
      count: files.length,
      roundtrips,
      noPlaintext,
      rejected,
      tamperRejected,
    };
  }, scope);
  assert.equal(results.count, 16);
  assert.equal(new Set(results.roundtrips).size, 16);
  assert(results.roundtrips.every((value) => value.endsWith("-plaintext")));
  assert(results.noPlaintext);
  assert(results.rejected);
  assert(results.tamperRejected);
  await context.close();
  return {
    concurrent_tabs: 2,
    concurrent_files: 16,
    all_roundtrips: true,
    scoped_access_rejected: true,
    tampering_rejected: true,
  };
}
