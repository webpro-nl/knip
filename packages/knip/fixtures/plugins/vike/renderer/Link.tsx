import { usePageContext } from './usePageContext'

export { Link }

function Link(props: { href: string; className?: string; children: React.ReactNode }) {
  const pageContext = usePageContext()
  const { urlPathname } = pageContext
  const { href } = props
  const isActive = href === '/' ? urlPathname === href : urlPathname.startsWith(href)
  const className = [props.className, isActive && 'is-active'].filter(Boolean).join(' ')
  return <a {...props} className={className} />
}
