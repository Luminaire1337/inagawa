import { pino, Logger } from 'pino';

interface LoginRequestData {
  code?: '';
  login: string;
  password: string;
}

interface LoginRequestResponseData {
  error: boolean;
  token: string;
  user: string;
}

export default class LoginToken {
  private token?: string;
  private logger: Logger = pino({ name: 'LoginToken' });

  public constructor() {
    this.refresh();
    setInterval(async () => await this.refresh(), 6 * 3600 * 1000);
  }

  private async refresh(): Promise<void> {
    try {
      const bodyData: LoginRequestData = {
        login: process.env.PARADISERPG_LOGIN,
        password: process.env.PARADISERPG_PASSWORD,
      };

      const response: Response = await fetch(
        'https://ucp.paradise-rpg.pl/api/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyData),
        },
      );

      const responseData: LoginRequestResponseData =
        (await response.json()) as LoginRequestResponseData;

      if (responseData.error === true) {
        throw Error('Something went wrong with fetching LoginToken');
      }

      this.token = responseData.token;
    } catch (error: unknown) {
      this.logger.error(error);
      setTimeout(async () => await this.refresh(), 1000);
    }
  }

  public getToken(): string {
    return this.token;
  }
}
