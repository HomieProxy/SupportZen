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

// This is a simplified, robust parser for multipart/form-data
export async function parseMultipartFormData(req: NextRequest): Promise<ParsedForm> {
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
        throw new Error('Invalid content-type. Expected multipart/form-data.');
    }

    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
        throw new Error('No boundary found in content-type header.');
    }

    const bodyBuffer = Buffer.from(await req.arrayBuffer());
    const parts = splitBuffer(bodyBuffer, `--${boundary}`);

    const result: ParsedForm = { fields: {}, files: {} };

    for (const part of parts) {
        if (part.length === 0) continue;

        const [headerPart, bodyPart] = splitBuffer(part, '\r\n\r\n', 2);
        if (!headerPart || !bodyPart) continue;

        const headerStr = headerPart.toString('utf-8');
        const nameMatch = headerStr.match(/name="([^"]+)"/);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/);

        if (nameMatch) {
            const name = nameMatch[1];
            if (filenameMatch) {
                // It's a file
                const filename = filenameMatch[1];
                const contentTypeMatch = headerStr.match(/Content-Type: (.+)/);
                const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
                
                const newFilename = `${randomUUID()}${path.extname(filename)}`;
                const filePath = path.join(uploadDir, newFilename);
                await fs.writeFile(filePath, bodyPart.slice(0, -2)); // Remove trailing \r\n

                result.files[name] = {
                    filename: newFilename,
                    contentType: contentType,
                    data: bodyPart.slice(0, -2),
                };
            } else {
                // It's a field
                result.fields[name] = bodyPart.slice(0, -2).toString('utf-8'); // Remove trailing \r\n
            }
        }
    }
    return result;
}

// Helper to split a buffer by a delimiter, similar to string.split()
function splitBuffer(buffer: Buffer, delimiter: string, limit?: number): Buffer[] {
    const delimiterBuffer = Buffer.from(delimiter);
    const result: Buffer[] = [];
    let start = 0;
    
    while(true) {
        if (limit && result.length === limit - 1) {
            result.push(buffer.subarray(start));
            break;
        }

        const index = buffer.indexOf(delimiterBuffer, start);
        if (index === -1) {
            result.push(buffer.subarray(start));
            break;
        }

        result.push(buffer.subarray(start, index));
        start = index + delimiterBuffer.length;
    }

    // The first part is often empty, and the last part is the '--' end boundary
    return result.slice(1, -1);
}
