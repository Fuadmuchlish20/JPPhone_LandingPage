import type { IncomingMessage } from "node:http";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import { config } from "../config";
import { HttpError } from "./util";

/** Stream a single multipart file field ("apk") to a temp file. Caller must cleanup(). */
export async function receiveApk(req: IncomingMessage): Promise<{ file: string; name: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "ce-apk-"));
  const cleanup = () => rm(dir, { recursive: true, force: true });
  const file = path.join(dir, "upload.apk");

  try {
    const name = await new Promise<string>((resolve, reject) => {
      const bb = Busboy({
        headers: req.headers,
        limits: { files: 1, fileSize: config.apkMaxBytes, fields: 0 },
      });
      let got = false;
      let writing: Promise<void> | null = null;
      let origName = "app.apk";

      bb.on("file", (field, stream, info) => {
        if (field !== "apk" || got) {
          stream.resume();
          return;
        }
        got = true;
        origName = info.filename || origName;
        stream.on("limit", () => reject(new HttpError(413, "apk_too_large")));
        writing = pipeline(stream, createWriteStream(file));
      });
      bb.on("error", reject);
      bb.on("close", () => {
        if (!got || !writing) return reject(new HttpError(400, "missing_apk_field"));
        writing.then(() => resolve(origName), reject);
      });
      req.pipe(bb);
    });

    if (!/\.apk$/i.test(name)) throw new HttpError(400, "not_an_apk");
    return { file, name, cleanup };
  } catch (e) {
    await cleanup();
    throw e;
  }
}
