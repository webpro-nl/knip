export type PM2Application = {
  script?: string;
};

type PM2Applications = PM2Application | PM2Application[];

type PM2RootConfig = PM2Application & {
  apps?: PM2Applications;
};

export type PM2Config = PM2RootConfig | PM2Application[];
