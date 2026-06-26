export type TrackedFile = {
  location: string;
};

export type Favicon = {
  inline?: string;
};

export type Dashboard = {
  customCss?: string[];
  favicon?: Favicon;
};

export type LunariaConfig = {
  files: TrackedFile[];
  renderer?: string;
  dashboard?: Dashboard;
};
