import { pino, Logger } from 'pino';
import { PrismaClient, WarehouseVehicle } from '@prisma/client';
import LoginToken from './LoginToken';
import Signal from './Signal';

interface IGroupPermissions {
  isGroupOwner: boolean;
  warehouse?: boolean;
  gates?: boolean;
  vehicles?: boolean;
  lombard?: boolean;
  leader?: boolean;
}

interface IWarehouseVehicle {
  id: number;
  vehicle_model: number;
  default_vehicle_price: number;
  vehicle_price: number;
  stats: string;
  color: string;
}

interface IWarehouseData {
  id: number;
  price_start: number;
  price_rent: number;
  size: number;
  minimum_level: number;
  vehicles: IWarehouseVehicle[];
}

interface IWarehouseGroupData {
  id: number;
  warehouseID: number;
  groupID: number;
  expires: number;
  warehouse: IWarehouseData;
}

interface IWarehouse {
  permissions: IGroupPermissions;
  warehouse?: IWarehouseGroupData;
}

export default class Warehouse {
  private token?: string;
  private warehouseVehicles?: IWarehouseVehicle[];
  private readonly logger: Logger = pino({ name: this.constructor.name });
  private readonly onVehiclePriceUpdate: Signal<WarehouseVehicle> = new Signal<WarehouseVehicle>();

  public constructor(private prisma: PrismaClient, private remoteLoginToken: LoginToken) {
    this.remoteLoginToken.ChangeEvent.on(async token => this.updateLoginToken(token));
    setInterval(async () => this.refresh(), 60 * 1000);
  }

  public get VehiclePriceUpdateEvent(): Signal<WarehouseVehicle> {
    return this.onVehiclePriceUpdate;
  }

  private async updateLoginToken(token: string): Promise<void> {
    this.token = token;
    await this.refresh();
  }

  private async refresh(): Promise<void> {
    try {
      if (!this.token) return;

      const response: Response = await fetch(
        `https://ucp.paradise-rpg.pl/api/group/${process.env.PARADISERPG_GROUPID}/warehouses`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${this.token}`,
          },
        },
      );

      const responseData: IWarehouse = (await response.json()) as IWarehouse;
      this.warehouseVehicles = responseData.warehouse.warehouse.vehicles;
    } catch (error: unknown) {
      this.logger.error(error);
      setTimeout(async () => await this.refresh(), 1000);
    } finally {
      /**
      const unassignedRemoteInstances = await this.prisma.warehouse.findMany({
        where: {
          remoteId: null,
        },
      });
      **/
    }
  }
}
