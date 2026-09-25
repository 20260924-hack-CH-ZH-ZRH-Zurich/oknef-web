"use client";

import { useEffect, useState } from "react";
import { useCaptureBoundary } from "@/features/capture/useCaptureBoundary";
import { usePreferences } from "@/features/preferences/Preferences";
import { CameraCapture } from "./CameraCapture";
import { decodeQrImage } from "./decode";
import { qrImageFromExport } from "./importEvidence";

const messages = {
  en: {
    label: "Scan a QR image",
    help: "Choose an image, import an Oknef extension evidence JSON, or take a photo. Decoding stays on this device. Review the decoded text before submitting; links never open automatically.",
    busy: "Reading locally…",
    error: "No readable QR found. Use a clear PNG, JPEG or WebP under 4 MiB.",
    result: "QR decoded. Review the evidence below.",
  },
  es: {
    label: "Escanear imagen QR",
    help: "Elige una imagen, importa el JSON de evidencia de la extensión Oknef o toma una foto. La lectura se realiza en este dispositivo. Revisa el texto antes de enviarlo; los enlaces nunca se abren automáticamente.",
    busy: "Leyendo localmente…",
    error:
      "No se encontró un QR legible. Usa PNG, JPEG o WebP nítido de menos de 4 MiB.",
    result: "QR leído. Revisa la evidencia debajo.",
  },
  de: {
    label: "QR-Bild scannen",
    help: "Wähle ein Bild, importiere eine Beleg-JSON-Datei der Oknef-Erweiterung oder mache ein Foto. Die Erkennung bleibt auf diesem Gerät. Prüfe den Text vor dem Senden; Links öffnen sich nie automatisch.",
    busy: "Lokale Erkennung…",
    error:
      "Kein lesbarer QR-Code gefunden. Verwende eine klare PNG-, JPEG- oder WebP-Datei unter 4 MiB.",
    result: "QR-Code erkannt. Prüfe die Angaben unten.",
  },
  fr: {
    label: "Scanner une image QR",
    help: "Choisissez une image, importez un JSON de preuve de l’extension Oknef ou prenez une photo. Le décodage reste sur cet appareil. Vérifiez le texte avant de l’envoyer ; les liens ne s’ouvrent jamais automatiquement.",
    busy: "Lecture locale…",
    error:
      "Aucun QR lisible. Utilisez une image PNG, JPEG ou WebP nette de moins de 4 Mio.",
    result: "QR décodé. Vérifiez les éléments ci-dessous.",
  },
};
export function QrCapture({
  onDecoded,
  onEvidence,
  onBusyChange,
}: {
  onDecoded: (content: string) => void;
  onEvidence?: (file: File, source: "camera" | "upload") => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { locale } = usePreferences();
  const text = messages[locale];
  const [status, setStatus] = useState<"busy" | "error" | "result" | null>(
    null,
  );
  const [cameraActive, setCameraActive] = useState(false);
  const boundary = useCaptureBoundary(() => {
    setStatus(null);
  });
  useEffect(() => {
    onBusyChange?.(status === "busy" || cameraActive);
  }, [status, cameraActive, onBusyChange]);
  async function read(
    file: File | undefined,
    source: "camera" | "upload" = "upload",
  ) {
    if (!file) return;
    const epoch = ++boundary.current.epoch;
    setStatus("busy");
    onDecoded("");
    try {
      if (file.name.toLowerCase().endsWith(".json"))
        file = await qrImageFromExport(file);
      const decoded = await decodeQrImage(file);
      if (!boundary.current.mounted || epoch !== boundary.current.epoch) return;
      await onEvidence?.(file, source);
      if (!boundary.current.mounted || epoch !== boundary.current.epoch) return;
      onDecoded(decoded);
      setStatus("result");
    } catch {
      if (boundary.current.mounted && epoch === boundary.current.epoch)
        setStatus("error");
    }
  }
  return (
    <div className="rounded-2xl border border-border p-4 space-y-4">
      <CameraCapture
        onActiveChange={setCameraActive}
        onCapture={(file) => read(file, "camera")}
      />
      <label className="block">
        <span className="field-label">{text.label}</span>
        <input
          className="field"
          type="file"
          accept="image/png,image/jpeg,image/webp,application/json"
          capture="environment"
          disabled={status === "busy"}
          onChange={(event) => {
            void read(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </label>
      <p className="subtext mt-2">{text.help}</p>
      {status && (
        <p
          className="subtext mt-2"
          role={status === "error" ? "alert" : "status"}
        >
          {text[status]}
        </p>
      )}
    </div>
  );
}
