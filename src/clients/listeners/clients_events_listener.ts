import amqp from 'amqplib';
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
  options: {
    noAck: false
  }
})((msg: unknown, channel: amqp.Channel, raw: amqp.ConsumeMessage) => {
  listSubscribers().forEach(sub => {
    sub.send(JSON.stringify(msg));
  });

  channel.ack(raw);
});
