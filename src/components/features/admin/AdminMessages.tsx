'use client';
import { useAdminMessages, useDeleteMessage, useMarkMessage } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/format';

export const AdminMessages = () => {
  const { data: messages, error } = useAdminMessages();
  const mark = useMarkMessage();
  const remove = useDeleteMessage();
  const toast = useToast();
  const onError = (err: Error) => toast(err.message, 'error');

  const onDelete = (id: number) => {
    if (window.confirm('Delete this message?')) remove.mutate(id, { onError });
  };

  return (
    <>
      <h2>Messages</h2>
      {error && <p className="alert alert--error">{error.message}</p>}
      {messages?.length === 0 && (
        <p className="empty-state">No messages yet. Messages sent from the contact page appear here.</p>
      )}
      {messages?.map((m) => (
        <article key={m.message_id} className={m.is_read ? 'message' : 'message message--unread'}>
          <h3>{m.subject}{!m.is_read && <> <span className="status status--pending">New</span></>}</h3>
          <p>
            <strong>{m.name}</strong> &lt;<a href={`mailto:${m.email}`}>{m.email}</a>&gt;
            <br /><small>{formatDate(m.created_at)}</small>
          </p>
          <p>{m.message}</p>
          <div className="actions-cell">
            <button className="btn btn--sm" type="button" onClick={() => mark.mutate({ id: m.message_id, isRead: !m.is_read }, { onError })}>
              Mark as {m.is_read ? 'unread' : 'read'}
            </button>
            <button className="btn btn--sm btn--danger" type="button" onClick={() => onDelete(m.message_id)}>Delete</button>
          </div>
        </article>
      ))}
    </>
  );
};
