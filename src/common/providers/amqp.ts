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
  parser?: (s: string) => M;
}

interface PublishProps<M = undefined> {
  parser?: (m: M) => string;
  options?: amqp.Options.Publish;
}

type ConsumerFunc<M = unknown> = (msg: M, channel: amqp.Channel, raw: amqp.ConsumeMessage) => void;

export class Publisher {
  private channel: amqp.Channel;

  constructor(channel: amqp.Channel) {
    this.channel = channel;
  }

  public publish<M = unknown>(
    exchange: string,
    key: string,
    message: M,
    props?: PublishProps<M>
  ): boolean {
    const parser = props?.parser || JSON.stringify;
    return this.channel.publish(exchange, key, Buffer.from(parser(message)), props?.options);
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
        channel.consume(queue, (raw: amqp.ConsumeMessage) => {
          const parser = props?.parser || JSON.parse;
          func(parser(raw.content.toString()), channel, raw);
        }, props?.options);
      })
      .catch(err => {
        log.error(`failed to define consumer: ${err}`);
      });
  };
};

const createChannel = async (props?: ChannelProps): Promise<amqp.Channel> => {
  if (!connection) {
    return {} as amqp.Channel;
  }

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
