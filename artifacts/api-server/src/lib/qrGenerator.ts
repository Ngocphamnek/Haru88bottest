import { Jimp } from "jimp";
import { readFileSync } from "fs";
import { join } from "path";
import { logger } from "./logger";

const LOGO_RATIO = 0.22;
const SCALE = 0.9;
const PADDING = 22;

/**
 * Fetches a clean QR-only image from VietQR, scales it down by 10%,
 * overlays the HARU88 logo in the centre, and adds a colourful
 * purple→pink→orange gradient border frame.
 */
export async function generateBankQR(
  bankCode: string,
  accountNumber: string,
  amount: number,
  addInfo: string,
  accountName: string,
): Promise<Buffer> {
  const url =
    `https://img.vietqr.io/image/${bankCode}-${accountNumber}-qr_only.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(addInfo)}` +
    `&accountName=${encodeURIComponent(accountName)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`VietQR responded ${response.status}`);
  }
  const qrBuf = Buffer.from(await response.arrayBuffer());

  // Load & scale down 10%
  const qrImg = await Jimp.fromBuffer(qrBuf);
  const originalSize = qrImg.bitmap.width;
  const qrSize = Math.round(originalSize * SCALE);
  qrImg.resize({ w: qrSize, h: qrSize });

  // Overlay logo in centre
  const logoSize = Math.round(qrSize * LOGO_RATIO);
  const logoPath = join(__dirname, "..", "public", "haru88-logo.png");
  const logoRaw = readFileSync(logoPath);
  const logoImg = await Jimp.fromBuffer(logoRaw);
  logoImg.resize({ w: logoSize, h: logoSize });
  const lx = Math.round((qrSize - logoSize) / 2);
  const ly = Math.round((qrSize - logoSize) / 2);
  qrImg.composite(logoImg, lx, ly);

  // Create frame canvas (white base)
  const frameSize = qrSize + PADDING * 2;
  const frame = new Jimp({ width: frameSize, height: frameSize, color: 0xffffffff });

  // Paint colourful gradient border (diagonal: purple → pink → orange)
  // Only pixels outside the QR area get coloured
  frame.scan(0, 0, frameSize, frameSize, (x, y, idx) => {
    const inQR =
      x >= PADDING && x < PADDING + qrSize &&
      y >= PADDING && y < PADDING + qrSize;
    if (!inQR) {
      // t: 0 at top-left corner → 1 at bottom-right corner
      const t = (x + y) / (2 * (frameSize - 1));
      // purple (112,26,197) → pink (236,72,153) → orange (249,115,22)
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const s = t / 0.5;
        r = Math.round(112 + (236 - 112) * s);
        g = Math.round(26  + (72  - 26)  * s);
        b = Math.round(197 + (153 - 197) * s);
      } else {
        const s = (t - 0.5) / 0.5;
        r = Math.round(236 + (249 - 236) * s);
        g = Math.round(72  + (115 - 72)  * s);
        b = Math.round(153 + (22  - 153) * s);
      }
      frame.bitmap.data[idx]     = r;
      frame.bitmap.data[idx + 1] = g;
      frame.bitmap.data[idx + 2] = b;
      frame.bitmap.data[idx + 3] = 255;
    }
  });

  // Place QR on top of the coloured frame
  frame.composite(qrImg, PADDING, PADDING);

  logger.debug({ bankCode, accountNumber, amount }, "🖼️ Colourful QR generated");
  return frame.getBuffer("image/png");
}
