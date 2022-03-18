import amqp from 'amqplib';
import config, { ConfigurationError } from './config';

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

interface ConsumerProps {
  exchange?: ExchangeProps;
  queue?: ConsumerQueueProps;
  bindKeys?: string[];
  options?: amqp.Options.Consume;
}

type ConsumerFunc = (msg: amqp.ConsumeMessage) => void;

let connection: amqp.Connection = null;

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

export const createChannel = async (props?: ChannelProps): Promise<amqp.Channel> => {
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

export const createConsumer = async (props?: ConsumerProps): Promise<(func: ConsumerFunc) => void> => {
  if (!connection) {
    return () => () => undefined;
  }

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

  for (const key of (props?.bindKeys || [])) {
    await channel.bindQueue(
      queue.queue,
      props?.exchange?.name || '',
      key
    );
  }

  return (func: ConsumerFunc) => {
    channel.consume(queue.queue, func, props?.options);
  };
};

export default connection;
