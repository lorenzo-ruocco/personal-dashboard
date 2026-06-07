import { useCallback, useEffect, useRef, useState } from 'react'
import checklistLogo from './assets/CheckListLogo.png'
import './App.css'

const timeFormatter = new Intl.DateTimeFormat('de-CH', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: '2-digit',
  weekday: 'long',
  year: 'numeric',
})

const indexValueFormatter = new Intl.NumberFormat('de-CH', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

const indexPerformanceFormatter = new Intl.NumberFormat('de-CH', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'always',
  style: 'percent',
})

const marketFlagCodes = {
  CH: 'ch',
  DE: 'de',
  EU: 'eu',
  IT: 'it',
  JP: 'jp',
  UK: 'gb',
  US: 'us',
}

const legacyStickyNotesStorageKey = 'dashboard-sticky-notes'
const stickyNoteDragZIndex = 10000
const stickyNoteColorOptions = [
  { id: 'yellow', label: 'Gelbe Notiz' },
  { id: 'blue', label: 'Blaue Notiz' },
  { id: 'green', label: 'Gruene Notiz' },
  { id: 'red', label: 'Rote Notiz' },
]
const stickyNoteColorIds = stickyNoteColorOptions.map((color) => color.id)
const defaultLinkCollection = [
  {
    name: 'Privat',
    tiles: [
      { title: 'Gmail', target: 'https://mail.google.com' },
      { title: 'Kalender', target: 'https://calendar.google.com' },
      { title: 'Google Drive', target: 'https://drive.google.com' },
    ],
  },
  {
    name: 'Studium',
    tiles: [
      { title: 'Moodle', target: 'https://moodle.org' },
      { title: 'Google Scholar', target: 'https://scholar.google.com' },
      { title: 'Overleaf', target: 'https://www.overleaf.com' },
    ],
  },
  {
    name: 'Arbeit',
    tiles: [
      { title: 'Outlook', target: 'https://outlook.office.com' },
      { title: 'Microsoft Teams', target: 'https://teams.microsoft.com' },
      { title: 'GitHub', target: 'https://github.com' },
    ],
  },
]

function getStickyNoteColor(color) {
  return stickyNoteColorIds.includes(color) ? color : 'yellow'
}

function reorderLinkCategories(categories, draggedCategoryId, targetCategoryId, side) {
  if (draggedCategoryId === targetCategoryId) {
    return categories
  }

  const draggedCategory = categories.find(
    (category) => category.id === draggedCategoryId,
  )

  if (!draggedCategory) {
    return categories
  }

  const categoriesWithoutDragged = categories.filter(
    (category) => category.id !== draggedCategoryId,
  )
  const targetIndex = categoriesWithoutDragged.findIndex(
    (category) => category.id === targetCategoryId,
  )

  if (targetIndex === -1) {
    return categories
  }

  const insertIndex = side === 'after' ? targetIndex + 1 : targetIndex
  const reorderedCategories = [
    ...categoriesWithoutDragged.slice(0, insertIndex),
    draggedCategory,
    ...categoriesWithoutDragged.slice(insertIndex),
  ].map((category, index) => ({
    ...category,
    sortOrder: index + 1,
  }))

  const orderChanged = reorderedCategories.some(
    (category, index) => category.id !== categories[index]?.id,
  )

  return orderChanged ? reorderedCategories : categories
}

function getNormalizedTarget(target) {
  return (target ?? '').trim()
}

function getLinkUrl(target) {
  const normalizedTarget = getNormalizedTarget(target)

  if (!normalizedTarget) {
    return ''
  }

  if (/^https?:\/\//i.test(normalizedTarget)) {
    return normalizedTarget
  }

  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(normalizedTarget)) {
    return `https://${normalizedTarget}`
  }

  return ''
}

function getTileHref(target) {
  const linkUrl = getLinkUrl(target)

  if (linkUrl) {
    return linkUrl
  }
  return ''
}

function getFaviconUrl(target) {
  const linkUrl = getLinkUrl(target)

  if (!linkUrl) {
    return ''
  }

  try {
    const hostname = new URL(linkUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch {
    return ''
  }
}

function getLocalTargetType(target) {
  const normalizedTarget = getNormalizedTarget(target).toLowerCase()

  if (!normalizedTarget) {
    return 'FILE'
  }

  if (normalizedTarget.endsWith('.exe') || normalizedTarget.endsWith('.lnk')) {
    return 'APP'
  }

  if (normalizedTarget.includes('\\') || normalizedTarget.includes('/')) {
    const fileName = normalizedTarget.split(/[\\/]/).pop() ?? ''

    if (fileName.includes('.')) {
      return 'FILE'
    }

    return 'DIR'
  }

  return 'APP'
}

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" />
      <path d="M18 24c9-3 22-2 31 3" />
      <path d="M20 32c8-2 19-2 27 3" />
      <path d="M22 40c6-2 15-1 21 2" />
    </svg>
  )
}

function YoutubeLogo() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="4" y="12" width="56" height="40" rx="12" />
      <path d="m27 23 15 9-15 9V23Z" />
    </svg>
  )
}

function WhatsappLogo() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="30" r="23" />
      <path d="m17 49 3-11" />
      <path d="M23 19c2-2 5 2 6 5 1 2-2 3-2 5 2 4 5 7 9 8 2 0 3-3 5-2 3 1 7 4 5 7-2 4-7 5-11 4-10-3-18-11-20-21-1-4 1-7 4-8 2-1 3 0 4 2Z" />
    </svg>
  )
}

function normalizeStickyNoteZIndexes(notes) {
  return notes
    .toSorted(
      (firstNote, secondNote) =>
        (Number(firstNote.zIndex) || 0) - (Number(secondNote.zIndex) || 0),
    )
    .map((note, index) => ({
      ...note,
      color: getStickyNoteColor(note.color),
      zIndex: index + 1,
    }))
}

function getNextStickyNoteZIndex(notes) {
  return (
    notes.reduce(
      (highestZIndex, note) =>
        Math.max(highestZIndex, Number(note.zIndex) || 0),
      0,
    ) + 1
  )
}

const weatherDescriptions = {
  0: ['☀', 'Klar'],
  1: ['◐', 'Leicht bewolkt'],
  2: ['☁', 'Bewolkt'],
  3: ['☁', 'Bedeckt'],
  45: ['≋', 'Nebel'],
  48: ['≋', 'Reifnebel'],
  51: ['☂', 'Leichter Nieselregen'],
  53: ['☂', 'Nieselregen'],
  55: ['☂', 'Starker Nieselregen'],
  61: ['☂', 'Leichter Regen'],
  63: ['☂', 'Regen'],
  65: ['☂', 'Starker Regen'],
  71: ['❄', 'Leichter Schnee'],
  73: ['❄', 'Schnee'],
  75: ['❄', 'Starker Schnee'],
  80: ['☂', 'Leichte Schauer'],
  81: ['☂', 'Schauer'],
  82: ['☂', 'Starke Schauer'],
  95: ['⚡', 'Gewitter'],
}

function getWeatherDescription(weatherCode) {
  return weatherDescriptions[weatherCode] ?? ['☁', 'Wetter']
}

function formatWeatherLocation(locationData) {
  const city =
    locationData.locality ||
    locationData.city ||
    locationData.principalSubdivision ||
    'Aktueller Standort'
  const region = locationData.principalSubdivision

  if (region && region !== city) {
    return `${city}, ${region}`
  }

  return city
}

function App() {
  const [tasks, setTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [showDoneTasks, setShowDoneTasks] = useState(false)
  const [leavingTaskIds, setLeavingTaskIds] = useState([])
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [stickyNotes, setStickyNotes] = useState([])
  const [linkCategories, setLinkCategories] = useState([])
  const [linkTiles, setLinkTiles] = useState([])
  const [marketIndices, setMarketIndices] = useState([])
  const [marketStatus, setMarketStatus] = useState('Märkte werden geladen...')
  const [weather, setWeather] = useState(null)
  const [weatherStatus, setWeatherStatus] = useState('Standort wird abgefragt...')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pinboardError, setPinboardError] = useState('')
  const [linkCollectionError, setLinkCollectionError] = useState('')
  const [spotifyStatus, setSpotifyStatus] = useState('')
  const [youtubeStatus, setYoutubeStatus] = useState('')
  const [whatsappStatus, setWhatsappStatus] = useState('')
  const [spotifyMediaStatus, setSpotifyMediaStatus] = useState({
    artist: '',
    available: false,
    playing: false,
    title: '',
  })
  const [youtubeMediaStatus, setYoutubeMediaStatus] = useState({
    artist: '',
    available: false,
    playing: false,
    title: '',
  })
  const [draggingNoteId, setDraggingNoteId] = useState(null)
  const [draggingCategoryId, setDraggingCategoryId] = useState(null)
  const leavingTimeouts = useRef({})
  const pinboardBodyRef = useRef(null)
  const stickyNoteDrag = useRef(null)
  const linksGridRef = useRef(null)
  const linkCategoriesRef = useRef([])
  const linkCategoryDrag = useRef(null)
  const spotifyWindowRef = useRef(null)

  const request = useCallback(async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      error.status = response.status
      try {
        error.body = await response.text()
      } catch {
        error.body = ''
      }
      throw error
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }, [])

  const cleanupDoneTasks = useCallback(function cleanupDoneTasks() {
    return fetch('/api/tasks/cleanup-completed', {
      method: 'POST',
      keepalive: true,
    })
  }, [])

  const loadTasks = useCallback(async function loadTasks() {
    try {
      setError('')
      await cleanupDoneTasks()
      const data = await request('/api/tasks')
      setTasks(data)
    } catch {
      setError('Backend is not reachable. Start Spring Boot on port 8080.')
    } finally {
      setLoading(false)
    }
  }, [cleanupDoneTasks, request])

  const saveNormalizedStickyNoteZIndexes = useCallback(
    async function saveNormalizedStickyNoteZIndexes(originalNotes, normalizedNotes) {
      const originalNotesById = new Map(
        originalNotes.map((note) => [note.id, note]),
      )
      const notesToSave = normalizedNotes.filter(
        (note) => {
          const originalNote = originalNotesById.get(note.id)

          return (
            Number(originalNote?.zIndex) !== note.zIndex ||
            originalNote?.color !== note.color
          )
        },
      )

      if (notesToSave.length === 0) {
        return
      }

      await Promise.all(
        notesToSave.map((note) =>
          request(`/api/sticky-notes/${note.id}`, {
            method: 'PUT',
            body: JSON.stringify(note),
          }),
        ),
      )
    },
    [request],
  )

  const loadStickyNotes = useCallback(async function loadStickyNotes() {
    try {
      const data = await request('/api/sticky-notes')
      setPinboardError('')

      if (data.length === 0) {
        const legacyNotes = window.localStorage.getItem(
          legacyStickyNotesStorageKey,
        )

        if (legacyNotes) {
          const parsedNotes = JSON.parse(legacyNotes)
          const migratedNotes = await Promise.all(
            parsedNotes.map((note, index) =>
              request('/api/sticky-notes', {
                method: 'POST',
                body: JSON.stringify({
                  color: getStickyNoteColor(note.color),
                  text: note.text ?? '',
                  x: note.x ?? 14 + (index % 3) * 154,
                  y: note.y ?? 14 + Math.floor(index / 3) * 164,
                  zIndex: note.zIndex ?? index + 1,
                }),
              }),
            ),
          )

          window.localStorage.removeItem(legacyStickyNotesStorageKey)
          const normalizedNotes = normalizeStickyNoteZIndexes(migratedNotes)
          setStickyNotes(normalizedNotes)
          try {
            await saveNormalizedStickyNoteZIndexes(migratedNotes, normalizedNotes)
          } catch {
            setPinboardError('Sticky note order could not be saved.')
          }
          return
        }
      }

      const normalizedNotes = normalizeStickyNoteZIndexes(data)
      setStickyNotes(normalizedNotes)
      try {
        await saveNormalizedStickyNoteZIndexes(data, normalizedNotes)
      } catch {
        setPinboardError('Sticky note order could not be saved.')
      }
    } catch {
      setPinboardError('Sticky notes could not be loaded.')
    }
  }, [request, saveNormalizedStickyNoteZIndexes])

  const migrateDefaultLinkCollection = useCallback(
    async function migrateDefaultLinkCollection() {
    const createdCategories = []
    const createdTiles = []

    for (const [categoryIndex, category] of defaultLinkCollection.entries()) {
      const createdCategory = await request('/api/link-categories', {
        method: 'POST',
        body: JSON.stringify({
          name: category.name,
          sortOrder: categoryIndex + 1,
        }),
      })
      createdCategories.push(createdCategory)

      for (const [tileIndex, tile] of category.tiles.entries()) {
        const createdTile = await request('/api/link-tiles', {
          method: 'POST',
          body: JSON.stringify({
            ...tile,
            categoryId: createdCategory.id,
            sortOrder: tileIndex + 1,
          }),
        })
        createdTiles.push(createdTile)
      }
    }

    setLinkCategories(createdCategories)
    setLinkTiles(createdTiles)
    },
    [request],
  )

  const loadLinkCollection = useCallback(async function loadLinkCollection() {
    try {
      const [categories, tiles] = await Promise.all([
        request('/api/link-categories'),
        request('/api/link-tiles'),
      ])
      setLinkCollectionError('')

      if (categories.length === 0 && tiles.length === 0) {
        await migrateDefaultLinkCollection()
        return
      }

      setLinkCategories(categories)
      setLinkTiles(tiles)
    } catch {
      setLinkCollectionError('Linksammlung konnte nicht geladen werden.')
    }
  }, [migrateDefaultLinkCollection, request])

  async function createLinkCategory() {
    const categoryDraft = {
      name: '',
      sortOrder: linkCategories.length + 1,
    }

    try {
      const createdCategory = await request('/api/link-categories', {
        method: 'POST',
        body: JSON.stringify(categoryDraft),
      })
      setLinkCategories((currentCategories) => [
        ...currentCategories,
        createdCategory,
      ])
      setLinkCollectionError('')
    } catch {
      setLinkCollectionError('Kategorie konnte nicht erstellt werden.')
    }
  }

  async function updateLinkCategory(category, changes) {
    const updatedDraft = {
      ...category,
      ...changes,
    }

    setLinkCategories((currentCategories) =>
      currentCategories.map((currentCategory) =>
        currentCategory.id === category.id ? updatedDraft : currentCategory,
      ),
    )

    try {
      const updatedCategory = await request(
        `/api/link-categories/${category.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updatedDraft),
        },
      )
      setLinkCategories((currentCategories) =>
        currentCategories.map((currentCategory) =>
          currentCategory.id === category.id ? updatedCategory : currentCategory,
        ),
      )
      setLinkCollectionError('')
    } catch {
      setLinkCollectionError('Kategorie konnte nicht gespeichert werden.')
    }
  }

  async function saveLinkCategoryOrder(categories) {
    const originalCategories = linkCategoryDrag.current?.originalCategories ?? []
    const originalCategoriesById = new Map(
      originalCategories.map((category) => [category.id, category]),
    )
    const categoriesToSave = categories.filter((category) => {
      const originalCategory = originalCategoriesById.get(category.id)

      return Number(originalCategory?.sortOrder) !== category.sortOrder
    })

    if (categoriesToSave.length === 0) {
      return
    }

    try {
      await Promise.all(
        categoriesToSave.map((category) =>
          request(`/api/link-categories/${category.id}`, {
            method: 'PUT',
            body: JSON.stringify(category),
          }),
        ),
      )
      setLinkCollectionError('')
    } catch {
      setLinkCategories(originalCategories)
      setLinkCollectionError('Kategorie-Reihenfolge konnte nicht gespeichert werden.')
    }
  }

  function getLinkCategoryDropTarget(clientX) {
    const categoryElements = Array.from(
      linksGridRef.current?.querySelectorAll('.link-column') ?? [],
    )
    const draggedCategoryId = linkCategoryDrag.current?.categoryId
    const targetElements = categoryElements.filter(
      (element) => Number(element.dataset.categoryId) !== draggedCategoryId,
    )

    if (targetElements.length === 0) {
      return null
    }

    const beforeElement = targetElements.find((element) => {
      const rect = element.getBoundingClientRect()

      return clientX < rect.left + rect.width / 2
    })

    if (beforeElement) {
      return {
        side: 'before',
        targetCategoryId: Number(beforeElement.dataset.categoryId),
      }
    }

    return {
      side: 'after',
      targetCategoryId: Number(
        targetElements[targetElements.length - 1].dataset.categoryId,
      ),
    }
  }

  function moveLinkCategoryToPointer(clientX) {
    const draggedCategoryId = linkCategoryDrag.current?.categoryId

    if (!draggedCategoryId) {
      return
    }

    const dropTarget = getLinkCategoryDropTarget(clientX)

    if (!dropTarget) {
      return
    }

    setLinkCategories((currentCategories) => {
      const reorderedCategories = reorderLinkCategories(
        currentCategories,
        draggedCategoryId,
        dropTarget.targetCategoryId,
        dropTarget.side,
      )
      linkCategoryDrag.current = {
        ...linkCategoryDrag.current,
        reorderedCategories,
      }

      return reorderedCategories
    })
  }

  function handleLinkCategoryPointerDown(event, categoryId) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    linkCategoryDrag.current = {
      categoryId,
      originalCategories: linkCategoriesRef.current,
      pointerId: event.pointerId,
      reorderedCategories: linkCategoriesRef.current,
    }
    setDraggingCategoryId(categoryId)
  }

  function handleLinkCategoryPointerMove(event) {
    if (linkCategoryDrag.current?.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    moveLinkCategoryToPointer(event.clientX)
  }

  function handleLinkCategoryPointerUp(event) {
    if (linkCategoryDrag.current?.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    event.currentTarget.releasePointerCapture(event.pointerId)
    handleLinkCategoryDragEnd()
  }

  function handleLinkCategoryDragEnd() {
    const reorderedCategories = linkCategoryDrag.current?.reorderedCategories

    setDraggingCategoryId(null)

    if (!reorderedCategories) {
      linkCategoryDrag.current = null
      return
    }

    saveLinkCategoryOrder(reorderedCategories).finally(() => {
      linkCategoryDrag.current = null
    })
  }

  async function deleteLinkCategory(categoryId) {
    try {
      await request(`/api/link-categories/${categoryId}`, {
        method: 'DELETE',
      })
      setLinkCategories((currentCategories) =>
        currentCategories.filter((category) => category.id !== categoryId),
      )
      setLinkTiles((currentTiles) =>
        currentTiles.filter((tile) => tile.categoryId !== categoryId),
      )
      setLinkCollectionError('')
    } catch {
      setLinkCollectionError('Kategorie konnte nicht geloescht werden.')
    }
  }

  async function createLinkTile(categoryId) {
    const categoryTiles = linkTiles.filter((tile) => tile.categoryId === categoryId)
    const tileDraft = {
      categoryId,
      title: '',
      target: '',
      sortOrder: categoryTiles.length + 1,
    }

    try {
      const createdTile = await request('/api/link-tiles', {
        method: 'POST',
        body: JSON.stringify(tileDraft),
      })
      setLinkTiles((currentTiles) => [...currentTiles, createdTile])
      setLinkCollectionError('')
    } catch {
      setLinkCollectionError('Kachel konnte nicht erstellt werden.')
    }
  }

  async function updateLinkTile(tile, changes) {
    const updatedDraft = {
      ...tile,
      ...changes,
    }

    setLinkTiles((currentTiles) =>
      currentTiles.map((currentTile) =>
        currentTile.id === tile.id ? updatedDraft : currentTile,
      ),
    )

    try {
      const updatedTile = await request(`/api/link-tiles/${tile.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedDraft),
      })
      setLinkTiles((currentTiles) =>
        currentTiles.map((currentTile) =>
          currentTile.id === tile.id ? updatedTile : currentTile,
        ),
      )
      setLinkCollectionError('')
    } catch {
      setLinkCollectionError('Kachel konnte nicht gespeichert werden.')
    }
  }

  async function deleteLinkTile(tileId) {
    try {
      await request(`/api/link-tiles/${tileId}`, {
        method: 'DELETE',
      })
      setLinkTiles((currentTiles) =>
        currentTiles.filter((tile) => tile.id !== tileId),
      )
      setLinkCollectionError('')
    } catch {
      setLinkCollectionError('Kachel konnte nicht geloescht werden.')
    }
  }

  async function openLinkTileTarget(target) {
    const normalizedTarget = getNormalizedTarget(target)

    if (!normalizedTarget) {
      return
    }

    try {
      await request('/api/open-target', {
        method: 'POST',
        body: JSON.stringify({ target: normalizedTarget }),
      })
      setLinkCollectionError('')
    } catch (openTargetError) {
      if (openTargetError.status === 404) {
        setLinkCollectionError(
          'Backend neu starten: Der Datei-/Programm-Oeffner ist noch nicht aktiv.',
        )
        return
      }

      if (openTargetError.status === 400) {
        setLinkCollectionError(
          'Pfad nicht gefunden. Kopiere den Pfad erneut aus dem Explorer.',
        )
        return
      }

      if (!openTargetError.status) {
        setLinkCollectionError('Backend ist nicht erreichbar.')
        return
      }

      setLinkCollectionError('Dateipfad oder Programm konnte nicht geoeffnet werden.')
    }
  }

  function openSpotify() {
    if (spotifyWindowRef.current && !spotifyWindowRef.current.closed) {
      spotifyWindowRef.current.focus()
      setSpotifyStatus('')
      return
    }

    const width = Math.round(window.screen.availWidth * 0.62)
    const height = window.screen.availHeight
    const left = window.screen.availLeft ?? 0
    const top = window.screen.availTop ?? 0
    const spotifyWindow = window.open(
      '',
      '_blank',
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    )

    if (!spotifyWindow || spotifyWindow === window) {
      setSpotifyStatus('Spotify-Popup wurde vom Browser blockiert.')
      return
    }

    spotifyWindow.opener = null
    spotifyWindow.location.replace('https://open.spotify.com/')
    spotifyWindowRef.current = spotifyWindow
    spotifyWindow.focus()
    setSpotifyStatus('')
  }

  async function openYoutube() {
    try {
      await request('/api/media-control/open/youtube', { method: 'POST' })
      setYoutubeStatus('')
    } catch {
      setYoutubeStatus('YouTube-Fenster konnte nicht geoeffnet werden.')
    }
  }

  async function openWhatsapp() {
    try {
      await request('/api/media-control/open/whatsapp', { method: 'POST' })
      setWhatsappStatus('')
    } catch {
      setWhatsappStatus('WhatsApp-Fenster konnte nicht geoeffnet werden.')
    }
  }

  const loadMediaStatuses = useCallback(async function loadMediaStatuses() {
    try {
      const [spotifyStatusData, youtubeStatusData] = await Promise.all([
        request('/api/media-control/status/spotify'),
        request('/api/media-control/status/youtube'),
      ])
      setSpotifyMediaStatus(spotifyStatusData)
      setYoutubeMediaStatus(youtubeStatusData)
      setSpotifyStatus('')
      setYoutubeStatus('')
    } catch {
      setSpotifyStatus('Medienstatus ist nicht erreichbar.')
    }
  }, [request])

  async function controlSpotify(action) {
    try {
      await request('/api/media-control', {
        method: 'POST',
        body: JSON.stringify({ action, provider: 'spotify' }),
      })
      setSpotifyStatus('')
      window.setTimeout(loadMediaStatuses, 350)
    } catch {
      setSpotifyStatus('Mediensteuerung ist nicht erreichbar.')
    }
  }

  async function controlYoutube(action) {
    try {
      await request('/api/media-control', {
        method: 'POST',
        body: JSON.stringify({ action, provider: 'youtube' }),
      })
      setYoutubeStatus('')
      window.setTimeout(loadMediaStatuses, 350)
    } catch {
      setYoutubeStatus('Mediensteuerung ist nicht erreichbar.')
    }
  }

  const saveStickyNote = useCallback(async function saveStickyNote(note) {
    if (!note) {
      return
    }

    try {
      const updatedNote = await request(`/api/sticky-notes/${note.id}`, {
        method: 'PUT',
        body: JSON.stringify(note),
      })
      setStickyNotes((currentNotes) =>
        currentNotes.map((currentNote) =>
          currentNote.id === note.id
            ? {
                ...updatedNote,
                color: getStickyNoteColor(updatedNote.color ?? note.color),
              }
            : currentNote,
        ),
      )
      setPinboardError('')
    } catch {
      setPinboardError('Sticky note could not be saved.')
    }
  }, [request])

  const loadMarketIndices = useCallback(async function loadMarketIndices() {
    try {
      const data = await request('/api/markets/indices')
      setMarketIndices(data)
      setMarketStatus('')
    } catch {
      setMarketStatus('Marktdaten konnten nicht geladen werden.')
    }
  }, [request])

  useEffect(() => {
    queueMicrotask(() => {
      loadTasks()
      loadStickyNotes()
      loadLinkCollection()
      loadMarketIndices()
      loadMediaStatuses()
    })
  }, [
    loadLinkCollection,
    loadMarketIndices,
    loadMediaStatuses,
    loadStickyNotes,
    loadTasks,
  ])

  useEffect(() => {
    const intervalId = window.setInterval(loadMediaStatuses, 2000)

    return () => window.clearInterval(intervalId)
  }, [loadMediaStatuses])

  useEffect(() => {
    linkCategoriesRef.current = linkCategories
  }, [linkCategories])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    function handlePointerMove(event) {
      if (!stickyNoteDrag.current || !pinboardBodyRef.current) {
        return
      }

      const { noteId, offsetX, offsetY, noteWidth, noteHeight } =
        stickyNoteDrag.current
      const boardRect = pinboardBodyRef.current.getBoundingClientRect()
      const maxX = Math.max(0, boardRect.width - noteWidth)
      const maxY = Math.max(0, boardRect.height - noteHeight)
      const nextX = Math.min(
        maxX,
        Math.max(0, event.clientX - boardRect.left - offsetX),
      )
      const nextY = Math.min(
        maxY,
        Math.max(0, event.clientY - boardRect.top - offsetY),
      )

      setStickyNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId ? { ...note, x: nextX, y: nextY } : note,
        ),
      )
      stickyNoteDrag.current = {
        ...stickyNoteDrag.current,
        x: nextX,
        y: nextY,
      }
    }

    function handlePointerUp() {
      if (stickyNoteDrag.current) {
        const { noteId, x, y, zIndex } = stickyNoteDrag.current
        saveStickyNote({
          ...stickyNotes.find((note) => note.id === noteId),
          id: noteId,
          x,
          y,
          zIndex,
        })
      }

      stickyNoteDrag.current = null
      setDraggingNoteId(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [saveStickyNote, stickyNotes])

  useEffect(() => {
    const controller = new AbortController()

    if (!navigator.geolocation) {
      queueMicrotask(() => {
        setWeatherStatus('Standort ist im Browser nicht verfügbar.')
      })
      return () => controller.abort()
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setWeatherStatus('Wetter wird geladen...')
          const { latitude, longitude } = position.coords
          const params = new URLSearchParams({
            latitude: latitude.toFixed(4),
            longitude: longitude.toFixed(4),
            current:
              'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
            daily: 'precipitation_probability_max',
            timezone: 'auto',
            forecast_days: '1',
          })
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
            { signal: controller.signal },
          )
          const locationResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&localityLanguage=de`,
            { signal: controller.signal },
          )

          if (!response.ok) {
            throw new Error('Weather request failed')
          }

          const data = await response.json()
          const locationData = locationResponse.ok
            ? await locationResponse.json()
            : null
          const [icon, description] = getWeatherDescription(
            data.current.weather_code,
          )

          setWeather({
            description,
            humidity: Math.round(data.current.relative_humidity_2m),
            icon,
            location: locationData
              ? formatWeatherLocation(locationData)
              : 'Aktueller Standort',
            precipitation: data.daily.precipitation_probability_max[0],
            temperature: Math.round(data.current.temperature_2m),
            windSpeed: Math.round(data.current.wind_speed_10m),
          })
          setWeatherStatus('')
        } catch (weatherError) {
          if (weatherError.name !== 'AbortError') {
            setWeatherStatus('Wetter konnte nicht geladen werden.')
          }
        }
      },
      () => {
        setWeatherStatus('Standortfreigabe wird für Wetter benötigt.')
      },
      {
        enableHighAccuracy: false,
        maximumAge: 600000,
        timeout: 10000,
      },
    )

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const activeLeavingTimeouts = leavingTimeouts.current

    window.addEventListener('beforeunload', cleanupDoneTasks)

    return () => {
      window.removeEventListener('beforeunload', cleanupDoneTasks)
      Object.values(activeLeavingTimeouts).forEach((timeoutId) =>
        clearTimeout(timeoutId),
      )
    }
  }, [cleanupDoneTasks])

  async function createTask() {
    try {
      const task = await request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: '',
          description: '',
        }),
      })

      setTasks((currentTasks) => [...currentTasks, task])
      setSelectedTaskId(task.id)
      setShowDoneTasks(false)
      setError('')
    } catch {
      setError('Task could not be created.')
    }
  }

  async function updateTaskText(task, changes) {
    const updatedDraft = {
      ...task,
      ...changes,
    }

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === task.id ? { ...item, ...changes } : item,
      ),
    )

    try {
      const updatedTask = await request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedDraft),
      })

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item.id === task.id ? updatedTask : item,
        ),
      )
      setError('')
    } catch {
      setError('Task could not be updated.')
    }
  }

  async function toggleTask(task) {
    setLeavingTaskIds((currentIds) =>
      currentIds.includes(task.id) ? currentIds : [...currentIds, task.id],
    )

    clearTimeout(leavingTimeouts.current[task.id])
    leavingTimeouts.current[task.id] = setTimeout(() => {
      setLeavingTaskIds((currentIds) =>
        currentIds.filter((taskId) => taskId !== task.id),
      )
      delete leavingTimeouts.current[task.id]
    }, 460)

    try {
      const updatedTask = await request(`/api/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...task,
          completed: !task.completed,
        }),
      })

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === task.id ? updatedTask : item)),
      )
      setSelectedTaskId(null)
      setError('')
    } catch {
      setError('Task could not be updated.')
    }
  }

  async function deleteTask(taskId) {
    if (taskId === null) {
      return
    }

    try {
      await request(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId),
      )
      setSelectedTaskId(null)
      setError('')
    } catch {
      setError('Task could not be deleted.')
    }
  }

  async function createStickyNote(color = 'yellow') {
    const zIndex = getNextStickyNoteZIndex(stickyNotes)
    const noteColor = getStickyNoteColor(color)
    const noteDraft = {
      color: noteColor,
      text: '',
      x: 14 + (stickyNotes.length % 3) * 154,
      y: 14 + Math.floor(stickyNotes.length / 3) * 164,
      zIndex,
    }

    try {
      const createdNote = await request('/api/sticky-notes', {
        method: 'POST',
        body: JSON.stringify(noteDraft),
      })
      setStickyNotes((currentNotes) => [
        ...currentNotes,
        {
          ...createdNote,
          color: getStickyNoteColor(createdNote.color ?? noteColor),
        },
      ])
      setPinboardError('')
    } catch {
      setPinboardError('Sticky note could not be created.')
    }
  }

  function updateStickyNote(noteId, text) {
    setStickyNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId ? { ...note, text } : note,
      ),
    )
  }

  async function deleteStickyNote(noteId) {
    try {
      await request(`/api/sticky-notes/${noteId}`, {
        method: 'DELETE',
      })
      setStickyNotes((currentNotes) =>
        currentNotes.filter((note) => note.id !== noteId),
      )
      setPinboardError('')
    } catch {
      setPinboardError('Sticky note could not be deleted.')
    }
  }

  function bringStickyNoteToFront(noteId) {
    const zIndex = getNextStickyNoteZIndex(stickyNotes)
    setStickyNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId ? { ...note, zIndex } : note,
      ),
    )

    return zIndex
  }

  function startStickyNoteDrag(event, noteId) {
    if (!pinboardBodyRef.current) {
      return
    }

    const zIndex = bringStickyNoteToFront(noteId)
    const noteElement = event.currentTarget.closest('.sticky-note')
    const noteRect = noteElement.getBoundingClientRect()
    const currentNote = stickyNotes.find((note) => note.id === noteId)

    stickyNoteDrag.current = {
      noteHeight: noteRect.height,
      noteId,
      noteWidth: noteRect.width,
      offsetX: event.clientX - noteRect.left,
      offsetY: event.clientY - noteRect.top,
      x: currentNote?.x ?? 0,
      y: currentNote?.y ?? 0,
      zIndex,
    }
    setDraggingNoteId(noteId)
  }

  const visibleTasks = tasks.filter((task) =>
    showDoneTasks
      ? task.completed || leavingTaskIds.includes(task.id)
      : !task.completed || leavingTaskIds.includes(task.id),
  )

  function formatIndexPerformance(changePercent) {
    return indexPerformanceFormatter.format((changePercent ?? 0) / 100)
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard" aria-label="Dashboard overview">
        <section className="dashboard-main" aria-label="Dashboard content">
        <h1>Dashboard</h1>
        <div className="dashboard-clock" aria-label="Current date and time">
          <time dateTime={currentDate.toISOString()}>
            {timeFormatter.format(currentDate)}
          </time>
          <span>{dateFormatter.format(currentDate)}</span>
        </div>
        <section className="weather-panel" aria-label="Current weather">
          {weather ? (
            <>
              <div className="weather-summary">
                <span className="weather-icon" aria-hidden="true">
                  {weather.icon}
                </span>
                <div>
                  <div className="weather-temperature-row">
                    <strong>{weather.temperature}°C</strong>
                    <span>{weather.location}</span>
                  </div>
                  <span className="weather-description">
                    {weather.description}
                  </span>
                </div>
              </div>
              <dl className="weather-details">
                <div>
                  <dt>Luftfeuchtigkeit</dt>
                  <dd>{weather.humidity}%</dd>
                </div>
                <div>
                  <dt>Wind</dt>
                  <dd>{weather.windSpeed} km/h</dd>
                </div>
                <div>
                  <dt>Niederschlag</dt>
                  <dd>{weather.precipitation}%</dd>
                </div>
              </dl>
            </>
          ) : (
            <p>{weatherStatus}</p>
          )}
        </section>

        <section className="market-panel" aria-label="Stock index performance">
          <h2>Aktienindizes</h2>
          {marketStatus && <p>{marketStatus}</p>}
          {!marketStatus && (
            <div className="market-list">
              {marketIndices.map((index) => {
                const performanceClass =
                  index.changePercent > 0
                    ? 'positive'
                    : index.changePercent < 0
                      ? 'negative'
                      : 'neutral'
                const flagCode = marketFlagCodes[index.regionCode]

                return (
                  <div className="market-index" key={index.id}>
                    <span className="market-region">
                      {flagCode ? (
                        <img
                          src={`https://flagcdn.com/w40/${flagCode}.png`}
                          alt=""
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="market-flag-fallback" aria-hidden="true">
                          {index.flag}
                        </span>
                      )}
                    </span>
                    <span className="market-name">{index.name}</span>
                    <span className="market-value">
                      {index.value === null
                        ? '--'
                        : indexValueFormatter.format(index.value)}
                    </span>
                    <span className={`market-performance ${performanceClass}`}>
                      {index.changePercent === null
                        ? '--'
                        : formatIndexPerformance(index.changePercent)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="app-panels-row">
        <section className="spotify-panel spotify-primary-panel" aria-label="Spotify player">
          <button
            className="spotify-logo-tile"
            type="button"
            aria-label="Spotify oeffnen"
            onClick={openSpotify}
          >
            <SpotifyLogo />
          </button>
          <div className="spotify-player-card">
            <div className="spotify-player-top">
              <span>Spotify</span>
            </div>
            <div className="spotify-track">
              <strong>{spotifyMediaStatus.title || 'Kein Lied aktiv'}</strong>
              <span>{spotifyMediaStatus.artist || 'Spotify'}</span>
            </div>
            <div className="spotify-controls">
              <button
                type="button"
                aria-label="Vorheriger Song"
                onClick={() => controlSpotify('previous')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 5v14" />
                  <path d="m19 6-10 6 10 6V6Z" />
                </svg>
              </button>
              <button
                className="spotify-play-button"
                type="button"
                aria-label={spotifyMediaStatus.playing ? 'Song anhalten' : 'Song abspielen'}
                onClick={() => controlSpotify('play-pause')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  {spotifyMediaStatus.playing ? (
                    <>
                      <path d="M9 7v10" />
                      <path d="M15 7v10" />
                    </>
                  ) : (
                    <path d="m8 6 10 6-10 6V6Z" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                aria-label="Naechster Song"
                onClick={() => controlSpotify('next')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="m5 6 10 6-10 6V6Z" />
                  <path d="M18 5v14" />
                </svg>
              </button>
            </div>
            <div className="spotify-progress" aria-hidden="true">
              <span />
            </div>
            {spotifyStatus && <p>{spotifyStatus}</p>}
          </div>
        </section>

        <section className="spotify-panel" aria-label="YouTube player">
          <button
            className="youtube-logo-tile"
            type="button"
            aria-label="YouTube oeffnen"
            onClick={openYoutube}
          >
            <YoutubeLogo />
          </button>
          <div className="spotify-player-card youtube-player-card">
            <div className="spotify-player-top">
              <span>YouTube</span>
            </div>
            <div className="spotify-track">
              <strong>{youtubeMediaStatus.title || 'Kein Video aktiv'}</strong>
              <span>{youtubeMediaStatus.artist || 'YouTube'}</span>
            </div>
            <div className="spotify-controls">
              <button
                type="button"
                aria-label="Vorheriges Video"
                onClick={() => controlYoutube('previous')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 5v14" />
                  <path d="m19 6-10 6 10 6V6Z" />
                </svg>
              </button>
              <button
                className="spotify-play-button"
                type="button"
                aria-label={youtubeMediaStatus.playing ? 'Video anhalten' : 'Video abspielen'}
                onClick={() => controlYoutube('play-pause')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  {youtubeMediaStatus.playing ? (
                    <>
                      <path d="M9 7v10" />
                      <path d="M15 7v10" />
                    </>
                  ) : (
                    <path d="m8 6 10 6-10 6V6Z" />
                  )}
                </svg>
              </button>
              <button
                type="button"
                aria-label="Naechstes Video"
                onClick={() => controlYoutube('next')}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="m5 6 10 6-10 6V6Z" />
                  <path d="M18 5v14" />
                </svg>
              </button>
            </div>
            <div className="spotify-progress" aria-hidden="true">
              <span />
            </div>
            {youtubeStatus && <p>{youtubeStatus}</p>}
          </div>
        </section>

        <section className="spotify-panel" aria-label="WhatsApp">
          <button
            className="whatsapp-logo-tile"
            type="button"
            aria-label="WhatsApp oeffnen"
            onClick={openWhatsapp}
          >
            <WhatsappLogo />
          </button>
          <button
            className="whatsapp-card"
            type="button"
            onClick={openWhatsapp}
          >
            <strong>WhatsApp Web</strong>
            <span>In Google Chrome öffnen</span>
            {whatsappStatus && <small>{whatsappStatus}</small>}
          </button>
        </section>
        </div>
        </section>

        <section className="pinboard" aria-label="Sticky notes">
        <header className="pinboard-header">
          <h2 aria-label="Pinwand"></h2>
          <div className="sticky-note-color-actions" aria-label="Notizfarbe">
            {stickyNoteColorOptions.map((color) => (
              <button
                className={`sticky-note-color-button sticky-note-color-button--${color.id}`}
                type="button"
                aria-label={`${color.label} erstellen`}
                key={color.id}
                onClick={() => createStickyNote(color.id)}
              >
                +
              </button>
            ))}
          </div>
        </header>

        <div className="sticky-notes" ref={pinboardBodyRef}>
          {pinboardError && <p className="pinboard-error">{pinboardError}</p>}

          {!pinboardError && stickyNotes.length === 0 && (
            <p className="pinboard-empty">Keine Notizen.</p>
          )}

          {stickyNotes.map((note, index) => (
            <article
              className={[
                'sticky-note',
                `sticky-note--${getStickyNoteColor(note.color)}`,
                draggingNoteId === note.id ? 'is-dragging' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={note.id}
              style={{
                left: `${note.x ?? 14 + (index % 3) * 154}px`,
                top: `${note.y ?? 14 + Math.floor(index / 3) * 164}px`,
                zIndex:
                  draggingNoteId === note.id
                    ? stickyNoteDragZIndex
                    : note.zIndex ?? index + 1,
              }}
            >
              <div
                className="sticky-note-handle"
                onPointerDown={(event) => startStickyNoteDrag(event, note.id)}
              >
                <button
                  type="button"
                  aria-label="Remove sticky note"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => deleteStickyNote(note.id)}
                >
                  ×
                </button>
              </div>
              <textarea
                value={note.text}
                onFocus={() => bringStickyNoteToFront(note.id)}
                onChange={(event) =>
                  updateStickyNote(note.id, event.target.value)
                }
                onBlur={() => saveStickyNote(note)}
                placeholder="Notiz"
                aria-label="Sticky note text"
              />
            </article>
          ))}
        </div>
        </section>

        <aside className="todo-window" aria-label="Todo list">
        <header className="todo-titlebar">
          <div className="todo-brand">
            <img src={checklistLogo} alt="" />
            <span>Todo-List</span>
          </div>
        </header>

        <div className="todo-toolbar">
          <button type="button" aria-label="Create task" onClick={createTask}>
            +
          </button>
          <button
            type="button"
            aria-label="Remove selected task"
            onClick={() => deleteTask(selectedTaskId)}
          >
            -
          </button>
          <button
            className={showDoneTasks ? 'is-active' : ''}
            type="button"
            aria-pressed={showDoneTasks}
            onClick={() => {
              setShowDoneTasks((currentValue) => !currentValue)
              setSelectedTaskId(null)
            }}
          >
            Done
          </button>
        </div>

        <section className="task-list" aria-label="Tasks">
          {loading && <p className="empty-state">Loading tasks...</p>}

          {!loading && visibleTasks.length === 0 && (
            <p className="empty-state">
              {showDoneTasks ? 'No done tasks.' : 'No open tasks.'}
            </p>
          )}

          {visibleTasks.map((task) => (
            <article
              className={[
                'task-item',
                task.completed ? 'completed' : '',
                selectedTaskId === task.id ? 'selected' : '',
                leavingTaskIds.includes(task.id) ? 'is-leaving' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
            >
              <div className="task-check">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {
                    setSelectedTaskId(task.id)
                    toggleTask(task)
                  }}
                />
                <span>
                  <input
                    className="task-title-input"
                    type="text"
                    value={task.title}
                    onChange={(event) =>
                      setTasks((currentTasks) =>
                        currentTasks.map((item) =>
                          item.id === task.id
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      )
                    }
                    onBlur={(event) =>
                      updateTaskText(task, { title: event.target.value })
                    }
                    onClick={(event) => event.stopPropagation()}
                    onFocus={() => setSelectedTaskId(task.id)}
                    placeholder="Title"
                    aria-label="Task title"
                  />
                  <textarea
                    className="task-description-input"
                    value={task.description}
                    onChange={(event) =>
                      setTasks((currentTasks) =>
                        currentTasks.map((item) =>
                          item.id === task.id
                            ? { ...item, description: event.target.value }
                            : item,
                        ),
                      )
                    }
                    onBlur={(event) =>
                      updateTaskText(task, { description: event.target.value })
                    }
                    onClick={(event) => event.stopPropagation()}
                    onFocus={() => setSelectedTaskId(task.id)}
                    placeholder="Description"
                    aria-label="Task description"
                    rows={5}
                  />
                </span>
              </div>
            </article>
          ))}
          {error && <p className="error">{error}</p>}
        </section>

        </aside>
      </section>

      <section className="links-section" aria-label="Link collection">
        <div className="links-section-inner">
          <header className="links-section-header">
            <button
              type="button"
              aria-label="Kategorie erstellen"
              onClick={createLinkCategory}
            >
              +
            </button>
          </header>
          {linkCollectionError && (
            <p className="links-error">{linkCollectionError}</p>
          )}
          <div
            className={[
              'links-grid',
              draggingCategoryId !== null ? 'is-category-dragging' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            ref={linksGridRef}
          >
            {linkCategories.map((category) => {
              const categoryTiles = linkTiles.filter(
                (tile) => tile.categoryId === category.id,
              )

              return (
                <section
                  className={[
                    'link-column',
                    draggingCategoryId === category.id ? 'is-dragging' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={`${category.name || 'Neue Kategorie'} links`}
                  data-category-id={category.id}
                  key={category.id}
                >
                  <header className="link-category-header">
                    <div
                      className="link-category-drag-zone"
                      aria-label="Kategorie verschieben"
                      role="button"
                      tabIndex={0}
                      onPointerDown={(event) =>
                        handleLinkCategoryPointerDown(event, category.id)
                      }
                      onPointerMove={handleLinkCategoryPointerMove}
                      onPointerUp={handleLinkCategoryPointerUp}
                      onPointerCancel={handleLinkCategoryPointerUp}
                    />
                    <button
                      className="link-category-drag-handle"
                      type="button"
                      aria-label="Kategorie verschieben"
                      onPointerDown={(event) =>
                        handleLinkCategoryPointerDown(event, category.id)
                      }
                      onPointerMove={handleLinkCategoryPointerMove}
                      onPointerUp={handleLinkCategoryPointerUp}
                      onPointerCancel={handleLinkCategoryPointerUp}
                    >
                      ::
                    </button>
                    <input
                      type="text"
                      value={category.name}
                      onChange={(event) =>
                        setLinkCategories((currentCategories) =>
                          currentCategories.map((currentCategory) =>
                            currentCategory.id === category.id
                              ? {
                                  ...currentCategory,
                                  name: event.target.value,
                                }
                              : currentCategory,
                          ),
                        )
                      }
                      onBlur={(event) =>
                        updateLinkCategory(category, {
                          name: event.target.value,
                        })
                      }
                      placeholder="Kategorie"
                      aria-label="Kategoriename"
                    />
                    <button
                      type="button"
                      aria-label="Kategorie loeschen"
                      onClick={() => deleteLinkCategory(category.id)}
                    >
                      -
                    </button>
                  </header>

                  <div className="link-tiles">
                    {categoryTiles.map((tile) => {
                      const faviconUrl = getFaviconUrl(tile.target)
                      const tileHref = getTileHref(tile.target)
                      const normalizedTarget = getNormalizedTarget(tile.target)
                      const tileLabel = tile.title || normalizedTarget || 'Kachel'
                      const launchClassName = [
                        'link-tile-launch',
                        normalizedTarget ? '' : 'is-disabled',
                      ]
                        .filter(Boolean)
                        .join(' ')

                      return (
                        <article className="link-tile" key={tile.id}>
                          {tileHref ? (
                            <a
                              className={launchClassName}
                              href={tileHref}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${tileLabel} oeffnen`}
                            >
                              <img src={faviconUrl} alt="" />
                            </a>
                          ) : (
                            <button
                              className={launchClassName}
                              type="button"
                              aria-label={`${tileLabel} oeffnen`}
                              onClick={() => openLinkTileTarget(tile.target)}
                              disabled={!normalizedTarget}
                            >
                              <span aria-hidden="true">
                                {getLocalTargetType(tile.target)}
                              </span>
                            </button>
                          )}
                          <div className="link-tile-fields">
                            <input
                              type="text"
                              value={tile.title}
                              title={tile.title}
                              onChange={(event) =>
                                setLinkTiles((currentTiles) =>
                                  currentTiles.map((currentTile) =>
                                    currentTile.id === tile.id
                                      ? {
                                          ...currentTile,
                                          title: event.target.value,
                                        }
                                      : currentTile,
                                  ),
                                )
                              }
                              onBlur={(event) =>
                                updateLinkTile(tile, {
                                  title: event.target.value,
                                })
                              }
                              placeholder="Name"
                              aria-label="Kachelname"
                            />
                            <input
                              type="text"
                              value={tile.target}
                              title={tile.target}
                              onChange={(event) =>
                                setLinkTiles((currentTiles) =>
                                  currentTiles.map((currentTile) =>
                                    currentTile.id === tile.id
                                      ? {
                                          ...currentTile,
                                          target: event.target.value,
                                        }
                                      : currentTile,
                                  ),
                                )
                              }
                              onBlur={(event) =>
                                updateLinkTile(tile, {
                                  target: event.target.value,
                                })
                              }
                              placeholder="Link oder Dateipfad"
                              aria-label="Link oder Dateipfad"
                            />
                          </div>
                          <button
                            type="button"
                            aria-label="Kachel loeschen"
                            onClick={() => deleteLinkTile(tile.id)}
                          >
                            -
                          </button>
                        </article>
                      )
                    })}
                  </div>

                  <button
                    className="link-tile-create"
                    type="button"
                    aria-label="Kachel erstellen"
                    onClick={() => createLinkTile(category.id)}
                  >
                    +
                  </button>
                </section>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
