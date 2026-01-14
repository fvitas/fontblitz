import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import { FONT_TYPES } from '@/constants.js'
import { googleFontCategories } from '@/fonts.js'
import { CheckIcon, SlidersHorizontalIcon } from 'lucide-react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

export function GoogleFontTypeFilterDropdown({ search, activeTab, onFontTypeChange }) {
  const [selectedFontTypes, setSelectedFontTypes] = useState(new Set())
  const isAllSelected = selectedFontTypes.size === 0

  function handleToggle(option) {
    const fontTypes = new Set(selectedFontTypes)
    fontTypes.has(option) ? fontTypes.delete(option) : fontTypes.add(option)

    setSelectedFontTypes(fontTypes)
    onFontTypeChange(fontTypes)
  }

  function handleAllToggle() {
    setSelectedFontTypes(new Set())
    onFontTypeChange(new Set())
  }

  if (search.length >= 2 || activeTab !== FONT_TYPES.GOOGLE) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative flex items-center justify-center">
          <SlidersHorizontalIcon />
          {!isAllSelected && (
            <Badge
              variant="default"
              className="absolute top-0 right-0 flex size-4 items-center justify-center p-0 text-xs">
              {selectedFontTypes.size}
            </Badge>
          )}
          <span className="sr-only">Filter</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-36">
        <DropdownMenuItem
          onSelect={event => event.preventDefault()}
          onClick={handleAllToggle}
          className="cursor-pointer">
          <div className="flex w-full items-center gap-2">
            <div
              className={twMerge(
                'flex h-4 w-4 items-center justify-center rounded border',
                isAllSelected && 'bg-primary border-primary',
              )}>
              {isAllSelected && <CheckIcon className="text-primary-foreground h-3 w-3" />}
            </div>
            <span>All</span>
          </div>
        </DropdownMenuItem>

        {googleFontCategories.map(fontType => (
          <DropdownMenuItem
            key={fontType}
            onSelect={event => event.preventDefault()}
            onClick={() => handleToggle(fontType)}
            className="cursor-pointer">
            <div className="flex w-full items-center gap-2">
              <div
                className={twMerge(
                  'flex h-4 w-4 items-center justify-center rounded border',
                  selectedFontTypes.has(fontType) && 'bg-primary border-primary',
                )}>
                {selectedFontTypes.has(fontType) && <CheckIcon className="text-primary-foreground h-3 w-3" />}
              </div>
              <span className="capitalize">{fontType}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
