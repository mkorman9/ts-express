import Account from '../models/account';
import PasswordCredentials from '../models/password_credentials';
import GithubCredentials from '../models/github_credentials';

export const findAccountById = async (id: string): Promise<Account | null> => {
  try {
    return await Account.findOne({
      where: {
        id: id,
        isDeleted: false
      },
      include: [
        PasswordCredentials,
        GithubCredentials
      ]
    });
  } catch (err) {
    if (err.name === 'SequelizeDatabaseError' &&
      err.original &&
      err.original.code === '22P02') {  // invalid UUID format
      return null;
    } else {
      throw err;
    }
  }
};

export const findAccountByCredentialsEmail = async (email: string): Promise<Account | null> => {
  const credentials = await PasswordCredentials.findOne({
    where: {
      email: email
    },
    include: [
      Account
    ]
  });

  if (!credentials) {
    return null;
  }

  return await Account.findOne({
    where: {
      id: credentials.accountId,
      isDeleted: false
    },
    include: [
      PasswordCredentials,
      GithubCredentials
    ]
  });
};
