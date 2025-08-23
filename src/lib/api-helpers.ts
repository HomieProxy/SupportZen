import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
const ensureUploadDirExists = async () => {
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
        console.error("Could not create upload directory", error);
    }
};
ensureUploadDirExists();


interface ParsedFile {
    filename: string;
    contentType: string;
    data: Buffer;
}

interface ParsedForm {
  fields: { [key: string]: string };
  files: { [key: string]: ParsedFile };
}


export async function parseMultipartFormData(req: NextRequest): Promise<ParsedForm> {
    const formData = await req.formData();
    const result: ParsedForm = { fields: {}, files: {} };

    for (const [name, value] of formData.entries()) {
        if (typeof value === 'string') {
            result.fields[name] = value;
        } else if (value instanceof File) {
            const fileBuffer = Buffer.from(await value.arrayBuffer());
            const newFilename = `${randomUUID()}${path.extname(value.name)}`;
            const filePath = path.join(uploadDir, newFilename);
            await fs.writeFile(filePath, fileBuffer);

            result.files[name] = {
                filename: newFilename,
                contentType: value.type,
                data: fileBuffer,
            };
        }
    }

    return result;
}
