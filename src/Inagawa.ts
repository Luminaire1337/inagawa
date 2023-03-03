import { Client, Events } from 'discord.js';
import { pino, Logger } from 'pino';
import { PrismaClient, Log, WarehouseVehicle } from '@prisma/client';
import { LoginToken, Logs, Warehouse } from './remote';

export default class Inagawa {
  private readonly client: Client = new Client({ intents: [] });
  private readonly logger: Logger = pino({ name: 'Inagawa' });
  private readonly prisma: PrismaClient = new PrismaClient();

  private readonly remoteLoginToken: LoginToken = new LoginToken();
  private readonly remoteWarehuse: Warehouse = new Warehouse(this.prisma, this.remoteLoginToken);
  private readonly remoteLogs: Logs = new Logs(this.prisma, this.remoteLoginToken);

  public constructor() {
    this.client.once(Events.ClientReady, () => this.clientReady());
    this.client.login(process.env.DISCORD_TOKEN);

    this.remoteLogs.NewLogEvent.on(async log => this.announceNewLog(log));
    this.remoteWarehuse.VehiclePriceUpdateEvent.on(async vehicle => this.announceVehiclePriceUpdate(vehicle));
  }

  private clientReady(): void {
    this.logger.info(`Logged in as ${this.client.user.tag}`);
  }

  private async announceNewLog(log: Log): Promise<void> {
    this.logger.info(log);
  }

  private async announceVehiclePriceUpdate(vehicle: WarehouseVehicle): Promise<void> {
    this.logger.info(vehicle);
  }
}
