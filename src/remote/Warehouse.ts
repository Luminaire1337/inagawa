import LoginToken from './LoginToken';

interface WarehouseVehicle {
  id: number;
  vehicle_model: number;
  default_vehicle_price: number;
  vehicle_price: number;
  color: string;
  stats: string;
}

export default class Warehouse {
  private remoteLoginToken?: LoginToken;

  public constructor(loginToken: LoginToken) {
    this.remoteLoginToken = loginToken;
    this.refresh();
  }

  private async refresh(): Promise<void> {}
}
