interface PointsData {
  items: string[];
  total: number;
}

export type GetPoints = Promise<PointsData>;
export type GetPointsResponse = PointsData;
export type GetPointsParams = { limit: number };
export type ScratchData = { id: number };

export async function fetchPoints(params: GetPointsParams): GetPoints {
  const data: GetPointsResponse = { items: [], total: params.limit };
  return data;
}

export const buildPoints = (params: GetPointsParams) => {
  const scratch: ScratchData = { id: params.limit };
  return scratch.id;
};
