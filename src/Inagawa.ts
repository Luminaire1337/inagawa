import { Client, Events } from 'discord.js';
import { pino, Logger } from 'pino';

export default class Inagawa {
  private client: Client = new Client({ intents: [] });
  private logger: Logger = pino({ name: 'Inagawa' });

  public constructor() {
    this.client.once(Events.ClientReady, () => this.clientReady());
    this.client.login(process.env.DISCORD_TOKEN);
  }

  private clientReady(): void {
    this.logger.info(`Logged in as ${this.client.user.tag}`);
  }
}
