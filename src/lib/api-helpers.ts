
import type { NextRequest } from 'next/server';
import formidable, { type File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Disable the default body parser for these routes
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

interface ParsedForm {
  fields: formidable.Fields;
  files: formidable.Files;
}

export async function parseForm(req: NextRequest): Promise<ParsedForm> {
    return new Promise((resolve, reject) => {
        const form = formidable({
            uploadDir,
            keepExtensions: true,
            filename: (name, ext, part) => {
                return `${randomUUID()}${ext}`;
            },
        });
        
        form.parse(req as any, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

export function getPublicUrl(file: File | File[] | undefined): string | undefined {
    if (!file) {
        return undefined;
    }
    const actualFile = Array.isArray(file) ? file[0] : file;
    if (!actualFile) {
        return undefined;
    }
    return `/uploads/${actualFile.newFilename}`;
}

export function getField(fields: formidable.Fields, key: string): string | undefined {
    const value = fields[key];
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
