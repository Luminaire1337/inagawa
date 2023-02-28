import { Client, Events } from 'discord.js';
import { pino, Logger } from 'pino';
import { LoginToken, Logs, Warehouse } from './remote';

export default class Inagawa {
  private readonly client: Client = new Client({ intents: [] });
  private readonly logger: Logger = pino({ name: 'Inagawa' });

  private readonly remoteLoginToken: LoginToken = new LoginToken();
  private readonly remoteWarehuse: Warehouse = new Warehouse(this.remoteLoginToken);
  private readonly remoteLogs: Logs = new Logs();

  public constructor() {
    this.client.once(Events.ClientReady, () => this.clientReady());
    this.client.login(process.env.DISCORD_TOKEN);
  }

  private clientReady(): void {
    this.logger.info(`Logged in as ${this.client.user.tag}`);
  }
}
