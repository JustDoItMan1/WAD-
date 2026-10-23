import { handle, json, readBody } from '@/lib/http';
import { deleteMessage, markMessage } from '@/lib/data/admin';
import { requireAdmin } from '@/lib/session';
import { requireId } from '@/lib/validate';

export const PATCH = handle<{ id: string }>(async (request, { id }) => {
  await requireAdmin();
  markMessage(requireId(id), Boolean((await readBody(request)).isRead));
  return json({ ok: true });
});

export const DELETE = handle<{ id: string }>(async (request, { id }) => {
  await requireAdmin();
  deleteMessage(requireId(id));
  return json({ ok: true });
});
