import { AppHeader } from '../components/layout'
import { Icon } from '../components/Icon'

type PlaceholderPageProps = {
  title: string
  subtitle: string
  icon: string
  note: string
}

export function PlaceholderPage({ title, subtitle, icon, note }: PlaceholderPageProps) {
  return (
    <>
      <AppHeader subtitle={subtitle} />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-margin pb-24 pt-16">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-lg bg-surface-container-lowest p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-primary">
            <Icon name={icon} className="text-[32px]" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-variant">{note}</p>
        </div>
      </main>
    </>
  )
}
