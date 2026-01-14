import { Button } from '@/components/ui/button.jsx'
import { FONT_TYPES } from '@/constants.js'
import { useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

function highlightText(match) {
  let result = []
  let lastIndex = 0

  match.indices.forEach(([startIdx, endIdx]) => {
    // Add text before the match
    if (startIdx > lastIndex) {
      result.push(match.value.substring(lastIndex, startIdx))
    }

    // Add the highlighted match
    result.push(
      <spans key={`highlight-${startIdx}`} className="bg-primary/50">
        {match.value.substring(startIdx, endIdx + 1)}
      </spans>,
    )

    lastIndex = endIdx + 1
  })

  // Add any remaining text after the last match
  if (lastIndex < match.value.length) {
    result.push(match.value.substring(lastIndex))
  }

  return result
}

function loadGoogleFont(fontFamily) {
  const googleFontId = `google-font-${fontFamily}`
  const fontLinkExists = document.getElementById(googleFontId)

  if (fontLinkExists) {
    return
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.id = googleFontId
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}&display=swap`
  document.head.appendChild(link)
}

export function FontButton({ font, isSelected, searchMatch, onPointerDown, onKeyDown }) {
  useEffect(() => {
    if (font.fontType === FONT_TYPES.GOOGLE) {
      loadGoogleFont(font.family)
    }
  }, [])

  return (
    <Button
      key={font.name}
      variant="ghost"
      size="icon"
      className={twMerge(
        'text-foreground hover:bg-primary/30 dark:hover:bg-primary/50 my-0.5 w-full cursor-pointer justify-start rounded-md p-4 text-left transition-colors',
        isSelected &&
          'bg-primary hover:bg-primary dark:hover:bg-primary text-primary-foreground hover:text-primary-foreground',
      )}
      style={{ fontFamily: font.family }}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}>
      <span className="text-lg">{searchMatch ? highlightText(searchMatch) : font.name}</span>
    </Button>
  )
}
