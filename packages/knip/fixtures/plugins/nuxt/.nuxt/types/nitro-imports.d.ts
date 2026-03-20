declare global {
  const getDb: typeof import('../../server/utils/db').getDb
  const capitalize: typeof import('../../shared/utils/capitalize').capitalize
}
declare global {
  export type { ApiResponse } from '../../shared/types/api'
}
export {}
