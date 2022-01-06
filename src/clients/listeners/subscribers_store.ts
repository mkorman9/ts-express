import ws from 'ws';
import { v4 as uuidv4 } from 'uuid';

const globalStore = new Map<string, ws>();

export const addSubscriber = (socket: ws): string => {
  const id = uuidv4();
  globalStore.set(id, socket);
  return id;
};

export const removeSubscriber = (id: string) => {
  globalStore.delete(id);
};

export const listSubscribers = (): ws[] => {
  return Array.from(globalStore.values())
    .filter(socket => socket.readyState === ws.OPEN);
};
