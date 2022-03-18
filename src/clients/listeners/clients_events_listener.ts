import { createConsumer } from '../../common/providers/amqp';
import { listSubscribers } from './subscribers_store';
import amqp from 'amqplib';

createConsumer({
  exchange: {
    name: 'clients_events',
    type: 'fanout',
    options: {
      durable: false
    }
  }
})((_, raw: amqp.ConsumeMessage) => {
  listSubscribers().forEach(sub => {
    sub.send(raw.content.toJSON());
  });
});
