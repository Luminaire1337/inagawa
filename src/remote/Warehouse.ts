import { pino, Logger } from 'pino';
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
  private readonly logger: Logger = pino({ name: 'Warehouse' });
  private readonly onChange: Signal<Warehouse, IWarehouseVehicle[]> = new Signal<Warehouse, IWarehouseVehicle[]>();

  public constructor(remoteLoginToken: LoginToken) {
    remoteLoginToken.ChangeEvent.on(async (_, token: string) => {
      this.token = token;
      if (process.env.NODE_ENV === 'development') this.logger.info('New login token received!');

      await this.refresh();
    });

    setInterval(async () => this.refresh(), 60 * 1000);
  }

  public get ChangeEvent(): Signal<Warehouse, IWarehouseVehicle[]> {
    return this.onChange;
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
      this.logger.info(this.warehouseVehicles);
    }
  }
}
