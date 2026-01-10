import { Button } from '@/components/ui/button.jsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import {
  BugIcon,
  CoffeeIcon,
  ExternalLinkIcon,
  InfoIcon,
  MoonIcon,
  MoreVerticalIcon,
  SparklesIcon,
  SunIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export function AppMenu() {
  const [theme, setTheme] = useState('light')
  const [aboutOpen, setAboutOpen] = useState(false)

  useEffect(() => {
    chrome?.storage?.local.get(['theme'], storage => {
      const savedTheme = storage.theme || 'light'
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      }
    })
  }, [])

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark')

    chrome?.storage?.local?.set({ theme: newTheme })
  }

  function handleCloseApp() {
    window.close()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVerticalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
            {theme === 'light' ? (
              <>
                <MoonIcon className="size-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <SunIcon className="size-4" />
                <span>Light Mode</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setAboutOpen(true)} className="cursor-pointer">
            <InfoIcon className="size-4" />
            <span>About</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() =>
              window.open('https://github.com/fvitas/font-switcher/issues/new?template=%F0%9F%9A%80-feature-request.md')
            }>
            <SparklesIcon className="size-4" />
            <span>Request a feature</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() =>
              window.open('https://github.com/fvitas/font-switcher/issues/new?template=%F0%9F%90%9B-bug-report.md')
            }>
            <BugIcon className="size-4" />
            <span>Report a bug</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer">
            <a
              href=""
              className="flex items-center gap-2"
              onClick={() => window.open('https://www.buymeacoffee.com/filipvitas')}>
              <CoffeeIcon className="size-4" />
              <span>Buy me a coffee / Donate</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleCloseApp}
            className="focus:bg-destructive/10 dark:focus:bg-destructive/30 cursor-pointer">
            <XIcon className="size-4" />
            <span>Close extension</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* About Modal */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Font Switcher</DialogTitle>
            <DialogDescription>Free · Open Source</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Version</span>
              <span>1.0.0</span>
            </div>

            <div className="flex justify-between">
              <span>Developed by</span>
              <a
                href="https://x.com/vitasdev"
                rel="noreferrer"
                target="_blank"
                className="flex items-center gap-1 transition hover:opacity-75">
                Filip Vitas
                <ExternalLinkIcon className="size-4" />
              </a>
            </div>

            <div className="flex justify-between">
              <span>Source code</span>
              <span>
                <a
                  href="https://github.com/fvitas/font-switcher"
                  rel="noreferrer"
                  target="_blank"
                  className="flex items-center gap-1 transition hover:opacity-75">
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="size-4">
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  <span>GitHub</span>
                  <ExternalLinkIcon className="size-4" />
                </a>
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
