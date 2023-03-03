import { pino, Logger } from 'pino';
import { PrismaClient, Log } from '@prisma/client';
import moment from 'moment';
import LoginToken from './LoginToken';
import Signal from './Signal';

interface IDateRequest {
  dateFrom: string;
  dateTo: string;
}

interface IRemoteLog {
  id: number;
  log: string;
  member_name: string;
  time: string;
}

export default class Logs {
  private token: string;
  private logs: IRemoteLog[];
  private readonly importPattern: RegExp = /^Import pojazdu (.+) o kwocie \$(\d+) do magazynu$/i;
  private readonly exportPattern: RegExp = /^Eksport pojazdu (.+) za \$(\d+) oraz (\d+) EXP$/i;
  private readonly artifactPattern: RegExp = /^Znalezienie artefaktu wartego \$(\d+) i (\d+) EXP$/i;
  private readonly pawnshopPattern: RegExp = /^W lombardzie '(.+)' umieszczono (\d+) przedmiotów o wartości \$(\d+)$/i;
  private readonly logger: Logger = pino({ name: this.constructor.name });
  private readonly onNewLog: Signal<Log> = new Signal<Log>();

  public constructor(private prisma: PrismaClient, private remoteLoginToken: LoginToken) {
    this.remoteLoginToken.ChangeEvent.on(async token => this.updateLoginToken(token));
    setInterval(async () => this.refresh(), 60 * 1000);
  }

  public get NewLogEvent(): Signal<Log> {
    return this.onNewLog;
  }

  private async updateLoginToken(token: string): Promise<void> {
    this.token = token;
    await this.refresh();
  }

  private async increasePayout(memberName: string, payoutAmount: number): Promise<void> {
    await this.prisma.payout.upsert({
      where: {
        memberName: memberName,
      },
      update: {
        payoutAmount: {
          increment: payoutAmount,
        },
      },
      create: {
        memberName: memberName,
        payoutAmount: payoutAmount,
      },
    });
  }

  private async refresh(): Promise<void> {
    try {
      const requestDateRange: IDateRequest = {
        dateFrom: moment.utc().format('YYYY-MM-DD'),
        dateTo: moment.utc().add(1, 'day').format('YYYY-MM-DD'),
      };

      const response: Response = await fetch(
        `https://ucp.paradise-rpg.pl/api/group/${process.env.PARADISERPG_GROUPID}/logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify(requestDateRange),
        },
      );

      const responseData: IRemoteLog[] = (await response.json()) as IRemoteLog[];
      this.logs = responseData;
    } catch (error: unknown) {
      this.logger.error(error);
      setTimeout(async () => await this.refresh(), 1000);
    } finally {
      this.logs.forEach(async log => {
        const logExists: Boolean =
          (await this.prisma.log.findFirst({
            where: {
              remoteId: log.id,
            },
          })) !== null;

        if (!logExists) {
          const newLog: Log = await this.prisma.log.create({
            data: {
              remoteId: log.id,
              memberName: log.member_name,
              message: log.log,
              time: log.time,
            },
          });

          this.onNewLog.trigger(newLog);

          // Check for vehicle imports/exports
          const importData: RegExpMatchArray = this.importPattern.exec(newLog.message);
          const exportData: RegExpMatchArray = this.exportPattern.exec(newLog.message);
          const artifactData: RegExpMatchArray = this.artifactPattern.exec(newLog.message);
          const pawnshopData: RegExpMatchArray = this.pawnshopPattern.exec(newLog.message);
          if (importData) {
            const [, vehicleName, currentPrice] = importData;

            await this.prisma.warehouseVehicle.create({
              data: {
                vehicleName: vehicleName,
                importerName: newLog.memberName,
                currentPrice: +currentPrice,
              },
            });
          } else if (exportData) {
            const [, , exportPrice] = exportData;
            const reevalutedPrice = +exportPrice * +process.env.PAYOUT_PERCENT;

            await this.increasePayout(newLog.memberName, reevalutedPrice);
          } else if (artifactData) {
            const [, artifactPrice] = artifactData;
            const reevalutedPrice = +artifactPrice * +process.env.PAYOUT_PERCENT;

            await this.increasePayout(newLog.memberName, reevalutedPrice);
          } else if (pawnshopData) {
            const [, , , itemsPrice] = pawnshopData;
            const reevalutedPrice = +itemsPrice * +process.env.PAYOUT_PERCENT;

            await this.increasePayout(newLog.memberName, reevalutedPrice);
          }
        }
      });
    }
  }
}
