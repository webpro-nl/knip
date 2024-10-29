export class Rectangle {
  constructor(
    public width: number,
    public height: number
  ) {}

  static Key = 1;

  public get unusedGetter(): string {
    return 'unusedGetter';
  }

  private set unusedSetter(w: number) {
    this.width = w;
  }

  area() {
    return this.width * this.height;
  }
}
