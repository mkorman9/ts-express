import amqp from 'amqplib';
import config, { ConfigurationError } from './config';

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

export default connection;
