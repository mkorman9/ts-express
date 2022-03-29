import amqp from 'amqplib';
import config, { ConfigurationError } from './config';
import log from './logging';

interface QueueProps {
  name: string;
  options: amqp.Options.AssertQueue;
}

interface ExchangeProps {
  name: string;
  type: string;
  options: amqp.Options.AssertExchange;
}

interface ChannelProps {
  queues?: QueueProps[];
  exchanges?: ExchangeProps[];
}

interface ConsumerQueueProps {
  name?: string;
  options: amqp.Options.AssertQueue;
}

interface ConsumerProps<M = unknown> {
  exchange?: ExchangeProps;
  queue?: ConsumerQueueProps;
  bindKeys?: string[];
  options?: amqp.Options.Consume;
  parser?: MessageParser<M>;
  prefetch?: number;
  autoConfirm?: boolean;
}

interface PublishProps<M = undefined> {
  parser?: MessageParser<M>;
  options?: amqp.Options.Publish;
}

export interface MessageParser<M = unknown> {
  serialize(m: M): Buffer
  deserialize(buffer: Buffer): M
  contentType(): string
}

type ConsumerFunc<M = unknown> = (msg: M, channel: amqp.Channel, raw: amqp.ConsumeMessage) => void;

export class JSONMessageParser<M = unknown> implements MessageParser<M> {
  serialize(m: M): Buffer {
    return Buffer.from(JSON.stringify(m));
  }

  deserialize(buffer: Buffer): M {
    return JSON.parse(buffer.toString());
  }

  contentType(): string {
    return 'application/json';
  }
}

export class Publisher {
  constructor(
    private channel: amqp.Channel
  ) { }

  public publish<M = unknown>(
    exchange: string,
    key: string,
    message: M,
    props?: PublishProps<M>
  ): boolean {
    if (!this.channel) {
      log.warn('not publishing AMQP message due to no active connection');
      return true;
    }

    const parser = props?.parser || new JSONMessageParser<M>();

    return this.channel.publish(exchange, key, parser.serialize(message), {
      contentType: parser.contentType(),
      ...props?.options
    });
  }
}

let connection: amqp.Connection = null;
const publishers = new Map<string, Publisher>();

export const initAMQP = async () => {
  const props = {
    uri: config.amqp?.uri
  };

  if (!props.uri) {
    throw new ConfigurationError('AMQP URI needs to be specified');
  }

  connection = await amqp.connect(props.uri);
};

export const closeAMQP = async () => {
  if (connection) {
    await connection.close();
  }
};

export const definePublisher = (name: string, props?: ChannelProps) => {
  if (!connection) {
    publishers.set(name, new Publisher(null));
    return;
  }

  createChannel(props)
    .then(channel => {
      publishers.set(name, new Publisher(channel));
    })
    .catch(err => {
      log.error(`failed to define publisher ${name}: ${err}`);
    });
};

export const getPublisher = (name: string): Publisher => {
  return publishers.get(name);
};

export const createConsumer = <M = unknown>(props?: ConsumerProps<M>): ((func: ConsumerFunc<M>) => void) => {
  if (!connection) {
    return () => () => undefined;
  }

  const init = async (): Promise<[amqp.Channel, string]> => {
    const channel = await connection.createChannel();

    if (props?.exchange) {
      await channel.assertExchange(
        props.exchange.name,
        props.exchange.type,
        props.exchange.options
      );
    }

    const queue = await channel.assertQueue(
      props?.queue?.name || '',
      props?.queue?.options
    );

    for (const key of (props?.bindKeys || [''])) {
      await channel.bindQueue(
        queue.queue,
        props?.exchange?.name || '',
        key
      );
    }

    return [channel, queue.queue];
  };

  return (func: ConsumerFunc<M>) => {
    init()
      .then(([channel, queue]) => {
        const parser = props?.parser || new JSONMessageParser<M>();

        if (props?.prefetch) {
          channel.prefetch(props.prefetch);
        }

        const autoConfirm = (props?.autoConfirm === undefined) ? true : props?.autoConfirm;
        const consumeOptions = {
          ...props?.options
        };

        if (autoConfirm) {
          consumeOptions.noAck = false;
        }

        channel.consume(queue, (raw: amqp.ConsumeMessage) => {
          let message: M;

          try {
            message = parser.deserialize(raw.content);
          } catch (err) {
            log.error(`failed to parse AMQP message ${raw.properties.messageId}: ${err}`);
            return;
          }

          try {
            func(message, channel, raw);

            if (autoConfirm) {
              channel.ack(raw);
            }
          } catch (err) {
            log.error(`error while executing AMQP consumer for message ${raw.properties.messageId}: ${err}`);

            if (autoConfirm) {
              channel.nack(raw);
            }
          }
        }, consumeOptions);
      })
      .catch(err => {
        log.error(`failed to define consumer: ${err}`);
      });
  };
};

const createChannel = async (props?: ChannelProps): Promise<amqp.Channel> => {
  const channel = await connection.createChannel();
  const queuesToDeclare = props?.queues || [];
  const exchangesToDeclare = props?.exchanges || [];

  for (const queue of queuesToDeclare) {
    await channel.assertQueue(
      queue.name,
      queue.options
    );
  }

  for (const exchange of exchangesToDeclare) {
    await channel.assertExchange(
      exchange.name,
      exchange.type,
      exchange.options
    );
  }

  return channel;
};
