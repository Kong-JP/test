import { MultipartFile } from "@fastify/multipart";
import path from "path";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";
import { randomUUID } from "crypto";

export async function uploadPdf(file: MultipartFile, uploadDir: string): Promise<string> {
  const filename = `${randomUUID()}.pdf`;
  const filepath = path.join(uploadDir, filename);
  
  await pipeline(
    file.file,
    createWriteStream(filepath)
  );

  return filepath;
} 