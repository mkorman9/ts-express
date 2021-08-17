import Account from '../models/account';
import PasswordCredentials from '../models/password_credentials';
import GithubCredentials from '../models/github_credentials';

export const findAccountByCredentialsEmail = async (email: string): Promise<Account | null> => {
  try {
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
  } catch (err) {
    throw err;
  }
};
