import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/ui/motion-tabs.jsx'
import { googleFonts } from '@/google-fonts.js'
import { isEmpty } from 'lodash'
import { SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

const systemFonts = await chrome?.fontSettings?.getFontList()
console.log(systemFonts)

const tabs = [
  {
    name: 'System Fonts',
    value: 'system',
    fonts: [
      // TODO (filipv): apply system fonts, set popular first
      { name: 'Arial', family: 'Arial, sans-serif' },
      { name: 'Times New Roman', family: 'Times New Roman, serif' },
      { name: 'Courier New', family: 'Courier New, monospace' },
      { name: 'Georgia', family: 'Georgia, serif' },
      { name: 'Verdana', family: 'Verdana, sans-serif' },
      { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif' },
      { name: 'Impact', family: 'Impact, sans-serif' },
      { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive' },
    ],
  },
  {
    name: 'Google Fonts',
    value: 'google',
    fonts: googleFonts.slice(0, 10),
  },
  {
    name: 'Custom Fonts',
    value: 'custom',
  },
]

function loadFont(fontFamily) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`
  document.head.appendChild(link)
}

function GoogleFontButton({ key, isSelected, font, onPointerDown, onKeyDown, children }) {
  useEffect(() => {
    loadFont(font.family)
  }, [])

  return (
    <Button
      key={key}
      variant="ghost"
      size="icon"
      className={twMerge(
        'text-foreground hover:bg-primary/30 my-0.5 w-full cursor-pointer justify-start rounded-md p-4 text-left transition-colors',
        isSelected && 'bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground',
      )}
      style={{ fontFamily: font.family }}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}>
      {children}
    </Button>
  )
}

export function App() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [customFonts, setCustomFonts] = useState([])
  const [fontUrl, setFontUrl] = useState('')
  const [fontName, setFontName] = useState('')
  const [selectedFont, setSelectedFont] = useState(null)

  function handleFileUpload(event) {
    const file = event.target.files?.[0]
    if (file && fontName) {
      const url = URL.createObjectURL(file)
      const newFont = {
        name: fontName,
        family: fontName,
        file,
        url,
      }
      setCustomFonts([...customFonts, newFont])
      setFontName('')
      event.target.value = ''
    }
  }

  function handleAddFontUrl() {
    if (fontUrl && fontName) {
      const newFont = {
        name: fontName,
        family: fontName,
        url: fontUrl,
      }
      setCustomFonts([...customFonts, newFont])
      setFontUrl('')
      setFontName('')
    }
  }

  async function selectFont(font) {
    setSelectedFont(font)

    // const [currentTab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    // chrome.tabs.sendMessage(currentTab?.id, {
    //   action: 'injectFont',
    //   fontUrl: `https://fonts.googleapis.com/css2?family=${font.family}&display=swap`,
    // })

    debugger
    //  if google font
    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })

    if (!tab) {
      return
    }

    const fontUrl = `https://fonts.googleapis.com/css2?family=${font.family}&display=swap`

    await chrome?.scripting?.executeScript({
      target: { tabId: tab.id },
      func: injectAndApplyFont,
      args: [fontUrl, font.family],
    })

    function injectAndApplyFont(fontUrl, fontFamily) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontUrl
      document.head.appendChild(link)

      const style = document.createElement('style')
      style.id = 'custom-font-override'
      style.textContent = `
    * {
      font-family: ${fontFamily} !important;
    }
    
    /* More specific selectors for stubborn elements */
    body, body * {
      font-family: ${fontFamily} !important;
    }
    
    /* Target common text elements */
    p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th, label, button, input, textarea {
      font-family: ${fontFamily} !important;
    }
  `

      const existing = document.getElementById('custom-font-override')
      if (existing) {
        existing.remove()
      }

      document.head.appendChild(style)
    }
  }

  return (
    <div className="bg-card text-card-foreground m-0 flex w-lg flex-col gap-4 p-6 py-6">
      <div className="flex items-center justify-between">
        <img src="/favicon/logo.svg" alt="Font Swapper logo" className="w-8" />

        <h2 className="text-2xl font-semibold">Font Swapper</h2>

        <Button variant="ghost" size="icon">
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
          <SearchIcon className="size-4" />
          <span className="sr-only">Search</span>
        </div>

        <Input
          id="search"
          name="search"
          type="search"
          placeholder="Search..."
          className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="system" className="gap-4" onValueChange={setActiveTab}>
        <TabsList className="w-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContents className="bg-background h-full">
          {tabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              {isEmpty(tab.fonts) ? (
                <div className="text-muted-foreground py-8 text-center">No fonts found</div>
              ) : (
                tab?.fonts?.map(font => {
                  if (tab.value === 'google') {
                    return (
                      <GoogleFontButton
                        key={font.name}
                        isSelected={selectedFont?.name === font.name}
                        font={font}
                        onPointerDown={() => selectFont(font)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            selectFont(font)
                          }
                        }}>
                        <span className="text-lg">{font.name}</span>
                      </GoogleFontButton>
                    )
                  }
                  return (
                    <Button
                      key={font.name}
                      variant="ghost"
                      size="icon"
                      className={twMerge(
                        'text-foreground hover:bg-primary/30 my-0.5 w-full cursor-pointer justify-start rounded-md p-4 text-left transition-colors',
                        selectedFont?.name === font.name &&
                          'bg-primary hover:bg-primary text-primary-foreground hover:text-primary-foreground',
                      )}
                      style={{ fontFamily: font.family }}
                      onPointerDown={() => selectFont(font)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          selectFont(font)
                        }
                      }}>
                      <span className="text-lg">{font.name}</span>
                    </Button>
                  )
                })
              )}
            </TabsContent>
          ))}
        </TabsContents>
      </Tabs>

      {activeTab === 'custom' && (
        <div className="border-border mb-4 space-y-3 rounded-md border p-4">
          <Input type="text" placeholder="Font name" value={fontName} onChange={e => setFontName(e.target.value)} />
          <div className="space-y-2">
            <Input type="text" placeholder="Font URL" value={fontUrl} onChange={e => setFontUrl(e.target.value)} />
            <Button onClick={handleAddFontUrl} className="w-full" disabled={!fontName || !fontUrl}>
              Add from URL
            </Button>
          </div>
          <div className="relative">
            <Input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFileUpload}
              disabled={!fontName}
              className="cursor-pointer"
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <Upload className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {/*<div className="max-h-[400px] space-y-2 overflow-y-auto">*/}
      {/*  {filteredFonts.map(font => (*/}
      {/*    <button*/}
      {/*      key={font.name}*/}
      {/*      className="border-border hover:border-foreground w-full rounded-md border px-4 py-3 text-left transition-colors"*/}
      {/*      style={{ fontFamily: font.family }}>*/}
      {/*      <span className="text-lg">{font.name}</span>*/}
      {/*    </button>*/}
      {/*  ))}*/}
      {/*  {activeTab === 'custom' && filteredFonts.length === 0 && (*/}
      {/*    <div className="text-muted-foreground py-8 text-center">No custom fonts added yet</div>*/}
      {/*  )}*/}
      {/*</div>*/}
    </div>
  )
}
