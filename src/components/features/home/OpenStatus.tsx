'use client';
import { useSyncExternalStore } from 'react';
import { CLOSING_TIME, FRIDAY_CLOSING_TIME, OPENING_TIME } from '@/constants';

const DEFAULT_TEXT = 'Open Monday to Thursday 07:30 to 15:30, Friday until 14:00.';

// Works out from the visitor's clock whether the counter is open right now
const describeNow = () => {
  const now = new Date();
  const day = now.getDay();
  const time = now.toTimeString().slice(0, 5);
  const closing = day === 5 ? FRIDAY_CLOSING_TIME : CLOSING_TIME;
  const isWeekday = day >= 1 && day <= 5;
  if (isWeekday && time >= OPENING_TIME && time < closing) return `Open now until ${closing}.`;
  if (isWeekday && time < OPENING_TIME) return `Opens today at ${OPENING_TIME}. You can place an order now for later.`;
  return DEFAULT_TEXT;
};

const noSubscription = () => () => {};

export const OpenStatus = () => {
  // The server renders the general hours; the browser swaps in today's status
  const text = useSyncExternalStore(noSubscription, describeNow, () => DEFAULT_TEXT);
  return <p className="board__hours">{text}</p>;
};
