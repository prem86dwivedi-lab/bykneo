import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads/kyc');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves a base64 image data URL to disk and returns its accessible relative URL
 * If already a normal URL (e.g. http:// or https://), returns as is
 */
export function saveBase64Image(dataUrlOrUrl, prefix = 'doc', id = 'usr') {
  if (!dataUrlOrUrl || typeof dataUrlOrUrl !== 'string') return '';
  
  // If it's already a web URL, return as is
  if (dataUrlOrUrl.startsWith('http://') || dataUrlOrUrl.startsWith('https://') || dataUrlOrUrl.startsWith('/uploads/')) {
    return dataUrlOrUrl;
  }

  // Check if valid data URL
  const matches = dataUrlOrUrl.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return dataUrlOrUrl;
  }

  try {
    const ext = matches[1].toLowerCase() === 'png' ? 'png' : 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Generate clean unique filename
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${prefix}_${safeId}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`💾 [IMAGE SAVED] ${filename} (${Math.round(buffer.length / 1024)} KB)`);

    return `/uploads/kyc/${filename}`;
  } catch (err) {
    console.error(`❌ Failed to save base64 image:`, err);
    return dataUrlOrUrl;
  }
}
