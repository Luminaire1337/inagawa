import { pino, Logger } from 'pino';
import Signal from './Signal';

interface ILoginRequest {
  code?: '';
  login: string;
  password: string;
}

interface ILoginRequestResponse {
  error: boolean;
  token: string;
  user: string;
}

export default class LoginToken {
  private token: string;
  private readonly logger: Logger = pino({ name: this.constructor.name });
  private readonly onChange: Signal<string> = new Signal<string>();

  public constructor() {
    this.refresh();
    setInterval(async () => await this.refresh(), 6 * 3600 * 1000);
  }

  public get ChangeEvent(): Signal<string> {
    return this.onChange;
  }

  private async refresh(): Promise<void> {
    try {
      const bodyData: ILoginRequest = {
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

      const responseData: ILoginRequestResponse = (await response.json()) as ILoginRequestResponse;

      if (responseData.error === true) {
        throw Error('Something went wrong with fetching LoginToken');
      }

      this.token = responseData.token;
    } catch (error: unknown) {
      this.logger.error(error);
      setTimeout(async () => await this.refresh(), 1000);
    } finally {
      this.onChange.trigger(this.token);
      if (process.env.NODE_ENV === 'development') this.logger.info('Login token refreshed!');
    }
  }
}
