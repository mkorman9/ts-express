import { subscribeChannel } from '../../common/providers/redis';
import { listSubscribers } from './subscribers_store';

subscribeChannel('clients_events', (data) => {
  listSubscribers().forEach(sub => {
    sub.send(JSON.stringify(data));
  });
});
