import { pino, Logger } from 'pino';
import { PrismaClient } from '@prisma/client';
import moment from 'moment';
import LoginToken from './LoginToken';
import Signal from './Signal';

interface IDateRequest {
  dateFrom: string;
  dateTo: string;
}

interface ILog {
  id: number;
  log: string;
  member_name: string;
  time: string;
}

export default class Logs {
  private token?: string;
  private logs?: ILog[];
  private prisma?: PrismaClient;
  private readonly logger: Logger = pino({ name: this.constructor.name });
  private readonly onNewLog: Signal<ILog> = new Signal<ILog>();

  public constructor(prisma: PrismaClient, remoteLoginToken: LoginToken) {
    this.prisma = prisma;

    remoteLoginToken.ChangeEvent.on(async token => this.updateLoginToken(token));
    setInterval(async () => this.refresh(), 60 * 1000);
  }

  public get NewLogEvent(): Signal<ILog> {
    return this.onNewLog;
  }

  private async updateLoginToken(token: string): Promise<void> {
    this.token = token;
    await this.refresh();
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

      const responseData: ILog[] = (await response.json()) as ILog[];
      this.logs = responseData;
    } catch (error: unknown) {
      this.logger.error(error);
      setTimeout(async () => await this.refresh(), 1000);
    } finally {
      this.logs.forEach(async log => {
        const dbLog = this.prisma.log.findUnique({
          where: {
            remoteId: log.id,
          },
        });

        if (!dbLog) {
          await this.prisma.log.create({
            data: {
              remoteId: log.id,
              authorName: log.member_name,
              message: log.log,
              time: log.time,
            },
          });

          this.onNewLog.trigger(log);
        }
      });
    }
  }
}
