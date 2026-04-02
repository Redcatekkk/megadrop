import { NextResponse } from 'next/server';
import { executeD1 } from '@/db/d1';

export async function GET() {
  const query = `
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      mime_type TEXT,
      r2_object_key TEXT NOT NULL,
      password_hash TEXT,
      max_downloads INTEGER,
      download_count INTEGER DEFAULT 0 NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    );
  `;

  try {
    await executeD1(query);
    return NextResponse.json({ success: true, message: "Tabela files gotowa!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
