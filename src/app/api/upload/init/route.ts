import { NextResponse } from 'next/server';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { insertFileRecord } from '@/db/d1';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filename, sizeBytes, mimeType, isOneTime, hasPassword, password, expiresInHours } = body;

    if (!filename || !sizeBytes) {
      return NextResponse.json({ success: false, error: "Brak wymaganych danych pliku" }, { status: 400 });
    }

    // Proste hashowanie hasła (dla MVP) - w docelowym rozwiązaniu użyć bcrypt
    let passwordHash = null;
    if (hasPassword && password) {
      // Very basic mock hashing for MVP context
      passwordHash = Buffer.from(password).toString('base64');
    }

    const fileId = uuidv4().substring(0, 8);
    const objectKey = `uploads/${fileId}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    console.log("Generowanie Presigned URL dla:", objectKey);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType || "application/octet-stream",
    });

    // Ważne: Link przesyłania wygaśnie po godzinie
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    const validHours = expiresInHours !== undefined && expiresInHours !== null ? Number(expiresInHours) : 168; // default 7 days

    console.log("Zapisywanie rekordu w D1...");
    await insertFileRecord({
      id: fileId,
      originalName: filename,
      sizeBytes,
      mimeType: mimeType || "application/octet-stream",
      r2ObjectKey: objectKey,
      passwordHash,
      maxDownloads: isOneTime ? 1 : null,
      expiresAt: validHours === 0 ? null : Date.now() + 1000 * 60 * 60 * validHours
    });

    return NextResponse.json({ success: true, signedUrl, fileId });
  } catch (err: any) {
    console.error("Presign Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
