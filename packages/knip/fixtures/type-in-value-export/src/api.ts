interface PointsData {
  items: string[];
  total: number;
}

export type GetPoints = Promise<PointsData>;
export type GetPointsResponse = PointsData;
export type GetPointsParams = { limit: number };

export async function fetchPoints(params: GetPointsParams): GetPoints {
  const data: GetPointsResponse = { items: [], total: params.limit };
  return data;
}
