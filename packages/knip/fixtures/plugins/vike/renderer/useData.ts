// https://vike.dev/useData
export { useData }

import { usePageContext } from './usePageContext'

/** https://vike.dev/useData */
function useData<Data>() {
  const { data } = usePageContext()
  return data as Data
}
