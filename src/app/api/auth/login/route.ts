import { handle, json, readBody } from '@/lib/http';
import { checkLogin } from '@/lib/data/users';
import { getSessionUser, startSession } from '@/lib/session';

export const POST = handle(async (request) => {
  const { email, password } = await readBody(request);
  const user = checkLogin(email, password);
  if (!user) return json({ error: 'Incorrect email or password.' }, 401);
  await startSession(user.user_id);
  return json({ user: await getSessionUser() });
});
