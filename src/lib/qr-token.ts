import { randomBytes } from "crypto";
import QRCode from "qrcode";

export function generateQrToken(): string {
  return randomBytes(24).toString("hex");
}

export function buildVerificationUrl(appUrl: string, registrationId: string, token: string) {
  return `${appUrl}/verify/${encodeURIComponent(registrationId)}?t=${encodeURIComponent(token)}`;
}

export async function generateQrCodeDataUrl(verificationUrl: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 400,
    color: { dark: "#0a0e17", light: "#ffffff" },
  });
}

export async function generateQrCodeBuffer(verificationUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 500,
    color: { dark: "#0a0e17", light: "#ffffff" },
  });
}
