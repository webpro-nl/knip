export const Shield = () => <div>shield</div>;

export const durability = 100;

export const enchantments = { fire: true };

const ArmorSet = () => (
  <div>
    <Shield />
    <span data-durability={durability} />
    <span {...enchantments} />
  </div>
);

ArmorSet;
