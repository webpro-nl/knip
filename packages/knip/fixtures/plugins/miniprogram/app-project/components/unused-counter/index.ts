interface IProps {
  count: number;
  onIncrement: () => void;
}

Component<IProps>({
  properties: {
    count: Number
  },
  methods: {
    handleTap() {
      this.triggerEvent('increment');
    }
  }
}); 