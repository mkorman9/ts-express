import { createConsumer } from '../../common/providers/amqp';
import log from '../../common/providers/logging';
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
})
  .then(consumer => {
    consumer((msg: amqp.ConsumeMessage) => {
      listSubscribers().forEach(sub => {
        sub.send(msg.content.toJSON());
      });
    });
  })
  .catch(err => {
    log.error(`failed to create consumer for clients_events: ${err}`);
  });
