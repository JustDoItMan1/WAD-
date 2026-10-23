import { handle, json, readBody } from '@/lib/http';
import { updateProfile } from '@/lib/data/users';
import { getSessionUser, requireUser } from '@/lib/session';

export const GET = handle(async () => json({ user: await getSessionUser() }));

export const PUT = handle(async (request) => {
  const user = await requireUser();
  updateProfile(user.id, await readBody(request));
  return json({ user: await getSessionUser() });
});
