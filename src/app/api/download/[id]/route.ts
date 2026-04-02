import { NextResponse } from 'next/server';
import { r2Client } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getFileRecord, deleteFileRecord, incrementDownloadCount } from '@/db/d1';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    let password = null;
    try {
      const body = await req.json();
      password = body.password;
    } catch(e) {}

    const file = await getFileRecord(id);
    if (!file) {
      return NextResponse.json({ success: false, error: "Plik nie istnieje lub został zniszczony." }, { status: 404 });
    }

    if (file.password_hash) {
      const inputHash = password ? Buffer.from(password).toString('base64') : null;
      if (!inputHash || inputHash !== file.password_hash) {
        return NextResponse.json({ success: false, error: "Nieprawidłowe hasło!" }, { status: 403 });
      }
    }

    if (file.expires_at && Date.now() > file.expires_at) {
      await deleteFileRecord(id);
      return NextResponse.json({ success: false, error: "Link wygasł." }, { status: 410 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: file.r2_object_key,
      ResponseContentDisposition: `attachment; filename="${file.original_name}"`
    });
    
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    const isMedia = file.mime_type && (file.mime_type.startsWith('image/') || file.mime_type.startsWith('video/') || file.mime_type.startsWith('audio/'));
    let previewUrl = null;
    
    // Jeśli plik ulega zniszczeniu, blokujemy podgląd na żywo, wymuszając jednorazowe pobranie.
    if (isMedia && file.max_downloads !== 1) {
      const previewCommand = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: file.r2_object_key,
        ResponseContentDisposition: `inline; filename="${file.original_name}"`,
        ResponseContentType: file.mime_type
      });
      previewUrl = await getSignedUrl(r2Client, previewCommand, { expiresIn: 900 });
    }

    if (file.max_downloads && file.download_count + 1 >= file.max_downloads) {
      await deleteFileRecord(id);
    } else {
      await incrementDownloadCount(id);
    }

    return NextResponse.json({ 
      success: true, 
      signedUrl, 
      previewUrl,
      file: { originalName: file.original_name, mimeType: file.mime_type } 
    });
  } catch (err: any) {
    console.error("Pobieranie Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
