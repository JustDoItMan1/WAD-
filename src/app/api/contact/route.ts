import { handle, json, readBody } from '@/lib/http';
import { saveMessage } from '@/lib/data/admin';

export const POST = handle(async (request) => {
  saveMessage(await readBody(request));
  return json({ ok: true }, 201);
});
