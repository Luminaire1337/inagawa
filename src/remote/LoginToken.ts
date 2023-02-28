import { pino, Logger } from 'pino';
import Signal from './Signal';

interface ILoginRequestData {
  code?: '';
  login: string;
  password: string;
}

interface ILoginRequestResponseData {
  error: boolean;
  token: string;
  user: string;
}

export default class LoginToken {
  private token?: string;
  private readonly logger: Logger = pino({ name: 'LoginToken' });
  private readonly onChange: Signal<LoginToken, string> = new Signal<LoginToken, string>();

  public constructor() {
    this.refresh();
    setInterval(async () => await this.refresh(), 6 * 3600 * 1000);
  }

  public get ChangeEvent(): Signal<LoginToken, string> {
    return this.onChange;
  }

  private async refresh(): Promise<void> {
    try {
      const bodyData: ILoginRequestData = {
        login: process.env.PARADISERPG_LOGIN,
        password: process.env.PARADISERPG_PASSWORD,
      };

      const response: Response = await fetch('https://ucp.paradise-rpg.pl/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const responseData: ILoginRequestResponseData = (await response.json()) as ILoginRequestResponseData;

      if (responseData.error === true) {
        throw Error('Something went wrong with fetching LoginToken');
      }

      this.token = responseData.token;
    } catch (error: unknown) {
      this.logger.error(error);
      setTimeout(async () => await this.refresh(), 1000);
    } finally {
      this.onChange.trigger(this, this.token);
      if (process.env.NODE_ENV === 'development') this.logger.info('Login token refreshed!');
    }
  }
}
