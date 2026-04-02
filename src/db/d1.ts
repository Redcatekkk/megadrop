export async function executeD1(query: string, params: any[] = []) {
  if (!process.env.R2_ACCOUNT_ID || !process.env.CLOUDFLARE_D1_DATABASE_ID || !process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error("Missing Cloudflare D1 environment variables");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.R2_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql: query, params })
  });

  const data = await res.json();
  if (!data.success) {
    console.error("D1 Full Error:", JSON.stringify(data, null, 2));
    throw new Error("D1 query err: " + JSON.stringify(data.errors));
  }
  return data;
}

export async function insertFileRecord(data: {
  id: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  r2ObjectKey: string;
  passwordHash?: string | null;
  maxDownloads?: number | null;
  expiresAt?: number | null;
}) {
  const query = `
    INSERT INTO files (id, original_name, size_bytes, mime_type, r2_object_key, password_hash, max_downloads, download_count, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?);
  `;
  const params = [
    data.id,
    data.originalName,
    data.sizeBytes,
    data.mimeType,
    data.r2ObjectKey,
    data.passwordHash || null,
    data.maxDownloads || null,
    data.expiresAt || null,
    Date.now()
  ];
  return executeD1(query, params);
}

export async function getFileRecord(id: string) {
  const query = `SELECT * FROM files WHERE id = ?`;
  const data = await executeD1(query, [id]);
  return data.result[0].results[0] || null;
}

export async function incrementDownloadCount(id: string) {
  const query = `UPDATE files SET download_count = download_count + 1 WHERE id = ?`;
  return executeD1(query, [id]);
}

export async function deleteFileRecord(id: string) {
  const query = `DELETE FROM files WHERE id = ?`;
  return executeD1(query, [id]);
}

export async function getGlobalStats() {
  const query = `
    SELECT 
      COUNT(id) as total_files,
      SUM(size_bytes) as total_bytes,
      SUM(download_count) as total_downloads
    FROM files
  `;
  const data = await executeD1(query);
  return data.result[0].results[0] || { total_files: 0, total_bytes: 0, total_downloads: 0 };
}
