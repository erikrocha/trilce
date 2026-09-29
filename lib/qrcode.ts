import QRCode from "qrcode";

export async function studentQrDataUrl(code: string) {
  return QRCode.toDataURL(code, { margin: 1, width: 320 });
}
