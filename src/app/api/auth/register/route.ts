import { handle, json, readBody } from '@/lib/http';
import { createUser } from '@/lib/data/users';
import { getSessionUser, startSession } from '@/lib/session';

export const POST = handle(async (request) => {
  const userId = createUser(await readBody(request));
  await startSession(userId);
  return json({ user: await getSessionUser() }, 201);
});
