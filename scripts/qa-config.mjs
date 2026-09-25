export function qaConfig() {
  const base = process.env.QA_BASE_URL;
  const output = process.env.QA_OUTPUT_DIR;
  if (!base || !output)
    throw new Error("QA_BASE_URL and QA_OUTPUT_DIR are required");
  return {
    base,
    output,
    executablePath: process.env.QA_CHROMIUM_PATH || undefined,
    liveAI: process.env.QA_LIVE_AI === "1",
    voice: process.env.QA_LIVE_VOICE === "1",
    audioFile: process.env.QA_AUDIO_FILE,
    videoFile: process.env.QA_VIDEO_FILE,
  };
}
