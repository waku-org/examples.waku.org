export class OrderedSet<T> {
  array: Array<T>;

  constructor(
    public orderCmp: (a: T, b: T) => boolean,
    public isEqual: (a: T, b: T) => boolean
  ) {
    this.array = [];
  }

  push(...items: T[]): void {
    for (const item of items) {
      this.insertInOrder(this.array, item);
    }
  }

  insertInOrder(array: T[], item: T): T[] {
    let i = 0;
    while (i < array.length) {
      if (this.isEqual(item, array[i])) {
        continue;
      }
      if (this.orderCmp(item, array[i])) {
        break;
      }
      i++;
    }

    array.splice(i, 0, item);
    return array;
  }
}
