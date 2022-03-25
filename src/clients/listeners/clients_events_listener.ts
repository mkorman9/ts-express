import { createConsumer } from '../../common/providers/amqp';
import { listSubscribers } from './subscribers_store';

createConsumer({
  exchange: {
    name: 'clients_events',
    type: 'fanout',
    options: {
      durable: false
    }
  },
  queue: {
    options: {
      autoDelete: true
    }
  }
})((msg: unknown) => {
  listSubscribers().forEach(sub => {
    sub.send(JSON.stringify(msg));
  });
});
