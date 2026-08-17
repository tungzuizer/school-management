/**
 * Google Drive & Google Sheets Integration Helpers
 */

export interface GoogleDriveUrlInfo {
  fileId: string;
  isSheet: boolean;
  sheetId?: string;
}

/**
 * Extracts Google File ID and checks if it is a Google Sheet or binary file.
 */
export function parseGoogleDriveUrl(urlOrId: string): GoogleDriveUrlInfo | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  const trimmed = urlOrId.trim();

  // Plain ID string (e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return { fileId: trimmed, isSheet: false };
  }

  // Google Sheets URL format
  const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch && sheetMatch[1]) {
    const gidMatch = trimmed.match(/[?&]gid=([0-9]+)/);
    return {
      fileId: sheetMatch[1],
      isSheet: true,
      sheetId: gidMatch ? gidMatch[1] : undefined,
    };
  }

  // Google Drive File URL format
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return { fileId: fileMatch[1], isSheet: false };
  }

  // Google Drive open?id= format
  const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return { fileId: openMatch[1], isSheet: false };
  }

  return null;
}

/**
 * Generates direct download or export URLs for Google Drive files.
 */
export function getGoogleDriveDownloadUrls(info: GoogleDriveUrlInfo) {
  const { fileId, isSheet, sheetId } = info;

  if (isSheet) {
    const baseExport = `https://docs.google.com/spreadsheets/d/${fileId}/export`;
    const csvUrl = sheetId
      ? `${baseExport}?format=csv&gid=${sheetId}`
      : `${baseExport}?format=csv`;
    const xlsxUrl = `${baseExport}?format=xlsx`;
    return { csvUrl, xlsxUrl, directUrl: xlsxUrl };
  }

  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return { directUrl, csvUrl: directUrl, xlsxUrl: directUrl };
}

/**
 * Fetches file buffer from Google Drive or Google Sheets link.
 */
export async function fetchGoogleDriveBuffer(urlOrId: string): Promise<{
  buffer: Buffer;
  fileName?: string;
  isSheet: boolean;
}> {
  const info = parseGoogleDriveUrl(urlOrId);
  if (!info) {
    throw new Error("Liên kết Google Drive không hợp lệ. Vui lòng kiểm tra lại URL.");
  }

  const urls = getGoogleDriveDownloadUrls(info);
  const targetUrl = info.isSheet ? urls.csvUrl : urls.directUrl;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Không tìm thấy tệp Google Drive (404). Vui lòng kiểm tra lại ID hoặc đường dẫn.");
      }
      if (response.status === 403 || response.status === 401) {
        throw new Error(
          "Tệp Google Drive chưa được mở quyền chia sẻ. Vui lòng bật chế độ 'Bất kỳ ai có liên kết đều có thể xem' (Anyone with the link can view)."
        );
      }
      throw new Error(`Không thể tải tệp từ Google Drive (Mã lỗi: ${response.status}).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If Google returned HTML instead of CSV/Binary (e.g. login required page), detect it
    const textHead = buffer.slice(0, 300).toString("utf-8").toLowerCase();
    if (textHead.includes("<!doctype html") || textHead.includes("<html")) {
      throw new Error(
        "Tệp Google Drive đang ở chế độ Riêng tư. Vui lòng đổi quyền chia sẻ tệp sang 'Bất kỳ ai có liên kết' (Anyone with the link)."
      );
    }

    return {
      buffer,
      isSheet: info.isSheet,
    };
  } catch (err: any) {
    throw new Error(err.message || "Lỗi khi kết nối tới Google Drive.");
  }
}
