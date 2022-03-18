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
})((msg: amqp.ConsumeMessage) => {
  listSubscribers().forEach(sub => {
    sub.send(msg.content.toJSON());
  });
});
