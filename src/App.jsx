import { AppMenu } from '@/AppMenu.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/ui/motion-tabs.jsx'
import { FontButton } from '@/FontButton.jsx'
import { FontSettingsDialog } from '@/FontSettingsDialog.jsx'
import { googleFonts } from '@/google-fonts.js'
import Fuse from 'fuse.js'
import { isEmpty } from 'lodash'
import { SearchIcon, SlidersHorizontalIcon, Upload } from 'lucide-react'
import { useState } from 'react'
import { Virtuoso } from 'react-virtuoso'

const popularSystemFonts = [
  { name: 'Arial', family: 'Arial, sans-serif' },
  { name: 'Helvetica', family: 'Helvetica, sans-serif' },
  { name: 'Verdana', family: 'Verdana, sans-serif' },
  { name: 'Tahoma', family: 'Tahoma, sans-serif' },
  { name: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif' },
  { name: 'Impact', family: 'Impact, sans-serif' },
  { name: 'Times New Roman', family: 'Times New Roman, serif' },
  { name: 'Georgia', family: 'Georgia, serif' },
  { name: 'Palatino', family: 'Palatino, serif' },
  { name: 'Courier New', family: 'Courier New, monospace' },
  { name: 'Comic Sans MS', family: 'Comic Sans MS, cursive' },
]
const systemFonts = await chrome?.fontSettings?.getFontList()

// TODO (filipv): check for duplicates in fonts
const tabs = [
  {
    name: 'System Fonts',
    value: 'system',
    fonts: [
      ...popularSystemFonts,
      ...systemFonts
        .map(font => ({ name: font.fontId, family: font.fontId }))
        .filter(font => !popularSystemFonts.find(pf => pf.name === font.name)),
    ],
  },
  {
    name: 'Google Fonts',
    value: 'google',
    fonts: googleFonts,
  },
  {
    name: 'Custom Fonts',
    value: 'custom',
  },
]

const fuse = new Fuse([...tabs.flatMap(tab => tab.fonts)], {
  keys: ['name'],
  threshold: 0.3,
  minMatchCharLength: 2,
  includeMatches: true,
  includeScore: true,
  isCaseSensitive: false,
})

function injectFont(fontFamily, fontCss) {
  let style = document.createElement('style')
  style.id = `font-face-injection-${fontFamily.replace(/\s+/g, '-')}`
  style.textContent = fontCss
  document.head.appendChild(style)
}

function applyFont(fontFamily) {
  const existingElement = document.getElementById('custom-font-override')
  if (existingElement) {
    existingElement.remove()
  }

  const style = document.createElement('style')
  style.id = 'custom-font-override'
  style.textContent = `
    * {
      font-family: ${fontFamily} !important;
    }
    
    p, span, div, h1, h2, h3, h4, h5, h6, a, li, td, th, label, button, input, textarea, select {
      font-family: ${fontFamily} !important;
    }
  `
  document.head.appendChild(style)
}

export function App() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('system')
  const [customFonts, setCustomFonts] = useState([])
  const [fontUrl, setFontUrl] = useState('')
  const [fontName, setFontName] = useState('')
  const [selectedFont, setSelectedFont] = useState(null)

  let results = []
  if (search.length >= 2) {
    results = fuse.search(search)
  }

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

  async function selectFont(font, fontType = 'system') {
    setSelectedFont(font)

    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    if (!tab) {
      return
    }

    if (fontType === 'system') {
      await chrome?.scripting?.executeScript({
        target: { tabId: tab.id },
        func: applyFont,
        args: [font.family],
      })
      return
    }

    if (fontType === 'google') {
      const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}&display=swap`

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: fontFamily => {
            const styleId = `font-face-injection-${fontFamily.replace(/\s+/g, '-')}`
            const styleElement = document.getElementById(styleId)
            return styleElement !== null
          },
          args: [font.family],
        })

        const fontStyleExists = results[0].result

        if (fontStyleExists) {
          await chrome?.scripting?.executeScript({
            target: { tabId: tab.id },
            func: applyFont,
            args: [font.family],
          })
          return
        }

        const response = await chrome.runtime.sendMessage({
          action: 'font:GET_FONT_FILES',
          cssUrl: fontUrl,
        })

        if (!response.success) {
          // show notifications
          throw new Error(response.error || 'Failed to fetch font files')
        }

        await chrome?.scripting?.executeScript({
          target: { tabId: tab.id },
          func: injectFont,
          args: [font.family, response.fonts.css],
        })
        await chrome?.scripting?.executeScript({
          target: { tabId: tab.id },
          func: applyFont,
          args: [font.family],
        })
      } catch (error) {
        console.error('Error injecting font:', error)
        // add notification for error
      }
    }
  }

  return (
    <div className="bg-card text-card-foreground m-0 flex w-96 flex-col gap-4 p-4">
      <div className="flex">
        <img src="/favicon/logo.svg" alt="Font Swapper logo" className="mr-4 w-8" />

        <div className="relative">
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50">
            <SearchIcon className="size-4" />
            <span className="sr-only">Search</span>
          </div>

          <div className="flex gap-2">
            <Input
              id="search"
              name="font-switcher-search"
              autocomplete="on"
              type="search"
              placeholder="Search..."
              className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/*<InputGroupButton variant="ghost" className="!pr-1.5 text-xs">*/}
              {/*  Search In... <ChevronDownIcon className="size-3" />*/}
              {/*</InputGroupButton>*/}
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute inset-y-0.5 right-0.5 flex items-center justify-center peer-disabled:opacity-50">
                <SlidersHorizontalIcon />
                <span className="sr-only">Filter</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="[--radius:0.95rem]">
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Sans</DropdownMenuItem>
              <DropdownMenuItem>Serif</DropdownMenuItem>
              <DropdownMenuItem>Slab</DropdownMenuItem>
              <DropdownMenuItem>Display</DropdownMenuItem>
              <DropdownMenuItem>Handwritten</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-4 flex gap-1">
          <FontSettingsDialog />
          <AppMenu />
        </div>
      </div>

      {search.length >= 2 ? (
        <div className="h-[300px] overflow-auto">
          {isEmpty(results) ? (
            <div className="text-muted-foreground flex h-full items-center justify-center pb-10">No fonts found</div>
          ) : (
            <Virtuoso
              style={{ height: '100%' }}
              data={results}
              itemContent={(index, result) => (
                <FontButton
                  key={'font-button-' + index}
                  font={result.item}
                  searchMatch={result?.matches?.at(0)}
                  isSelected={selectedFont?.name === result.item.name}
                  onPointerDown={event => {
                    if (event.button === 0) {
                      selectFont(result.item)
                    }
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectFont(result.item)
                    }
                  }}
                />
              )}
            />
          )}
        </div>
      ) : (
        <Tabs value={activeTab} className="gap-4" onValueChange={setActiveTab}>
          <TabsList className="w-full">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContents className="h-full">
            {tabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="h-[300px] overflow-auto">
                {!isEmpty(tab.fonts) && (
                  <Virtuoso
                    style={{ height: '100%' }}
                    data={tab?.fonts}
                    itemContent={(index, font) => (
                      <FontButton
                        key={'font-button-' + index}
                        font={font}
                        fontType={tab.value}
                        isSelected={selectedFont?.name === font.name}
                        onPointerDown={event => {
                          if (event.button === 0) {
                            selectFont(font, tab.value)
                          }
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            selectFont(font, tab.value)
                          }
                        }}
                      />
                    )}
                  />
                )}
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      )}

      {activeTab === 'custom' && (
        <>
          {/*<Card*/}
          {/*  className={`relative cursor-pointer border-2 border-dashed transition-colors ${*/}
          {/*    isDragging ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'*/}
          {/*  }`}*/}
          {/*  onDragOver={handleDragOver}*/}
          {/*  onDragLeave={handleDragLeave}*/}
          {/*  onDrop={handleDrop}*/}
          {/*  onClick={handleClick}>*/}
          {/*  <div className="flex flex-col items-center justify-center px-6 py-20">*/}
          {/*    <div*/}
          {/*      className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${*/}
          {/*        isDragging ? 'bg-primary/20' : 'bg-muted'*/}
          {/*      }`}>*/}
          {/*      <UploadI className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />*/}
          {/*    </div>*/}

          {/*    <h3 className="text-foreground mb-2 text-lg font-medium">*/}
          {/*      {isDragging ? 'Drop files here' : 'Drag & drop files here'}*/}
          {/*    </h3>*/}
          {/*    <p className="text-muted-foreground mb-4 text-sm">or click to browse from your computer</p>*/}

          {/*    <Button variant="secondary" size="sm" type="button">*/}
          {/*      Choose Files*/}
          {/*    </Button>*/}
          {/*  </div>*/}

          {/*  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />*/}
          {/*</Card>*/}

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
                <Upload className="size-4" />
              </div>
            </div>
          </div>

          <Card
            className={`relative cursor-pointer border-2 border-dashed transition-colors ${
              false ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'
            }`}
            onDragOver={() => {}}
            onDragLeave={() => {}}
            onDrop={() => {}}
            onClick={() => {}}>
            <div className="flex items-center justify-center gap-3 px-6 py-6">
              <Upload className={`h-5 w-5 ${false ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-foreground text-sm font-medium">
                {false ? 'Drop more files here' : 'Drop more files or click to browse'}
              </p>
            </div>

            <input ref={null} type="file" multiple className="hidden" onChange={() => {}} />
          </Card>
        </>
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
