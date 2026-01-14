import { AppMenu } from '@/AppMenu.jsx'
import { Card } from '@/components/ui/card.jsx'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group.jsx'
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/ui/motion-tabs.jsx'
import { FONT_TYPES } from '@/constants.js'
import { FontButton } from '@/FontButton.jsx'
import { googleFonts, popularSystemFonts } from '@/fonts.js'
import { FontSettingsDialog } from '@/FontSettingsDialog.jsx'
import { GoogleFontTypeFilterDropdown } from '@/GoogleFontTypeFilterDropdown.jsx'
import Fuse from 'fuse.js'
import isEmpty from 'lodash/isEmpty'
import { FileTypeIcon, SearchIcon, Upload, XIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { twMerge } from 'tailwind-merge'

const systemFonts = await chrome?.fontSettings?.getFontList()

const allSystemFonts = [
  ...popularSystemFonts,
  ...systemFonts
    .map(font => ({ name: font.fontId, family: font.fontId }))
    .filter(font => !popularSystemFonts.find(pf => pf.name === font.name)),
].map(font => ({ ...font, fontType: FONT_TYPES.SYSTEM }))

const allGoogleFonts = googleFonts.map(font => ({ ...font, fontType: FONT_TYPES.GOOGLE }))

const tabs = [
  {
    name: 'System Fonts',
    value: FONT_TYPES.SYSTEM,
    fonts: allSystemFonts,
  },
  {
    name: 'Google Fonts',
    value: FONT_TYPES.GOOGLE,
    fonts: allGoogleFonts,
  },
  {
    name: 'Custom Font',
    value: 'custom',
  },
]

const fuse = new Fuse(allSystemFonts.concat(allGoogleFonts), {
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

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function verifyFontFile(file) {
  const fileExtension = file.name.split('.').at(-1).toLowerCase()

  return fileExtension === 'ttf' || fileExtension === 'otf' || fileExtension === 'woff' || fileExtension === 'woff2'
}

async function loadFontFile(uploadedFile) {
  const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
  if (!tab) {
    return
  }

  const reader = new FileReader()
  reader.readAsDataURL(uploadedFile)

  reader.onload = async function (event) {
    const fontName = uploadedFile.name.split('.').at(0)
    const fontCss = `
      @font-face {
        font-family: ${fontName};
        src: url('${event.target.result}');
      }
    `

    // TODO (filipv): check if exits before injection
    await chrome?.scripting?.executeScript({
      target: { tabId: tab.id },
      func: injectFont,
      args: [fontName, fontCss],
    })
    await chrome?.scripting?.executeScript({
      target: { tabId: tab.id },
      func: applyFont,
      args: [fontName],
    })
  }
}

function CustomFontRenderer({ selectedFont, onFontSelect }) {
  const fileInputRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)

  useEffect(() => {
    if (selectedFont) {
      setUploadedFile(null)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [selectedFont])

  const handleDragOver = useCallback(event => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(event => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(event.dataTransfer.files ?? [])
    const droppedFile = droppedFiles.at(0)
    const isValidFontFile = verifyFontFile(droppedFile)

    if (droppedFile && isValidFontFile) {
      setUploadedFile(droppedFile)
      onFontSelect(null)
      loadFontFile(droppedFile)
    }
  }

  function handleFileInput(event) {
    const selectedFiles = Array.from(event.target.files ?? [])
    const selectedFile = selectedFiles.at(0)
    const isValidFontFile = verifyFontFile(selectedFile)

    if (selectedFile && isValidFontFile) {
      setUploadedFile(selectedFile)
      onFontSelect(null)
      loadFontFile(selectedFile)
    }
  }

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <Card
      className={`relative cursor-pointer border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}>
      <div className="flex flex-col items-center justify-center">
        <div
          className={twMerge(
            'bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md transition-colors',
            isDragging && 'bg-primary/10',
          )}>
          {uploadedFile ? (
            <FileTypeIcon className="text-muted-foreground h-4 w-4" />
          ) : (
            <Upload className="text-muted-foreground h-4 w-4" />
          )}
        </div>
        {uploadedFile ? (
          <>
            <p className="my-2 truncate text-sm font-medium text-wrap">{uploadedFile.name}</p>
            <p className="truncate text-sm font-medium text-wrap">{formatFileSize(uploadedFile.size)}</p>
            <p className="text-muted-foreground mt-4 text-xs text-wrap">Upload a new font to replace the current one</p>
          </>
        ) : (
          <>
            <p className="my-2 truncate text-sm font-medium text-wrap">Upload a font file</p>
            <p className="text-muted-foreground truncate text-xs text-wrap">Drag and drop or click to upload</p>
            <p className="text-muted-foreground text-xs text-wrap">OTF, TTF, WOFF and WOFF2</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".otf,.ttf,.woff,.woff2"
        onChange={handleFileInput}
      />
    </Card>
  )
}

function VirtualizedFontButtonList({ fonts = [], selectedFont, onFontSelect }) {
  if (isEmpty(fonts)) {
    return <div className="text-muted-foreground flex h-full items-center justify-center pb-10">No fonts found</div>
  }

  return (
    <Virtuoso
      style={{ height: '100%' }}
      data={fonts}
      itemContent={(index, font) => (
        <FontButton
          key={'font-button-' + index + font.name}
          font={font}
          searchMatch={font?.matches?.at(0)}
          isSelected={selectedFont?.name === font.name}
          onPointerDown={event => {
            if (event.button === 0) {
              onFontSelect(font)
            }
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onFontSelect(font)
            }
          }}
        />
      )}
    />
  )
}

export function App() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(FONT_TYPES.SYSTEM)
  const [selectedFont, setSelectedFont] = useState(null)

  const [filteredGoogleFonts, setFilteredGoogleFonts] = useState([])

  let results = []
  if (search.length >= 2) {
    results = fuse.search(search).map(result => ({ ...result, ...result.item }))
  }

  async function handleSelectFont(font) {
    if (!font?.fontType) {
      setSelectedFont(null)
      return
    }

    setSelectedFont(font)

    const [tab] = await chrome?.tabs?.query({ active: true, currentWindow: true })
    if (!tab) {
      return
    }

    if (font.fontType === FONT_TYPES.SYSTEM) {
      await chrome?.scripting?.executeScript({
        target: { tabId: tab.id },
        func: applyFont,
        args: [font.family],
      })
      return
    }

    if (font.fontType === FONT_TYPES.GOOGLE) {
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

  function handleGoogleFontCategoriesFilterChange(selectedCategories) {
    if (isEmpty(selectedCategories)) {
      setFilteredGoogleFonts([])
      return
    }
    setFilteredGoogleFonts(allGoogleFonts.filter(font => selectedCategories.has(font.category)))
  }

  return (
    <div className="bg-card text-card-foreground m-0 flex w-96 flex-col gap-4 p-4">
      <div className="flex items-center">
        <img src="/favicon/logo.svg" alt="FontBlitz logo" className="mr-4 size-7 min-h-7 min-w-7" />

        <InputGroup>
          <InputGroupInput
            id="search"
            name="font-switcher-search"
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
            type="text"
            placeholder="Search..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>

          {search.length >= 2 && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" onClick={() => setSearch('')}>
                <XIcon />
                <span className="sr-only">Reset search</span>
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <div className="ml-2 flex gap-1">
          <GoogleFontTypeFilterDropdown
            search={search}
            activeTab={activeTab}
            onFontTypeChange={handleGoogleFontCategoriesFilterChange}
          />

          <FontSettingsDialog />
          <AppMenu />
        </div>
      </div>

      {search.length >= 2 ? (
        <div className="h-[300px] overflow-auto">
          <VirtualizedFontButtonList
            fonts={results}
            selectedFont={selectedFont}
            onFontSelect={result => handleSelectFont(result.item)}
          />
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
                {tab.value === 'custom' && (
                  <CustomFontRenderer selectedFont={selectedFont} onFontSelect={() => handleSelectFont(null)} />
                )}
                {tab.value === FONT_TYPES.SYSTEM && (
                  <VirtualizedFontButtonList
                    fonts={tab.fonts}
                    selectedFont={selectedFont}
                    onFontSelect={handleSelectFont}
                  />
                )}
                {tab.value === FONT_TYPES.GOOGLE && (
                  <VirtualizedFontButtonList
                    fonts={!isEmpty(filteredGoogleFonts) ? filteredGoogleFonts : tab.fonts}
                    selectedFont={selectedFont}
                    onFontSelect={handleSelectFont}
                  />
                )}
              </TabsContent>
            ))}
          </TabsContents>
        </Tabs>
      )}
    </div>
  )
}
