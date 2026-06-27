type TrackedFile = {
  location: string;
};

type Favicon = {
  inline?: string;
};

type Dashboard = {
  customCss?: string[];
  favicon?: Favicon;
};

export type LunariaConfig = {
  files: TrackedFile[];
  renderer?: string;
  dashboard?: Dashboard;
};
