export default class Signal<T> {
  private handlers: Array<(data: T) => void> = [];

  public on(handler: (data: T) => void): void {
    this.handlers.push(handler);
  }

  public off(handler: (data: T) => void): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  public trigger(data: T): void {
    // Duplicate the array to avoid side effects during iteration.
    this.handlers.slice(0).forEach(h => h(data));
  }
}
