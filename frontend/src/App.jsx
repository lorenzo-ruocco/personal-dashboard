import { useEffect, useRef, useState } from 'react'
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

  let hostname = ''

  try {
    hostname = new URL(linkUrl).hostname
  } catch {
    return ''
  }

  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
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
  const [draggingNoteId, setDraggingNoteId] = useState(null)
  const leavingTimeouts = useRef({})
  const pinboardBodyRef = useRef(null)
  const stickyNoteDrag = useRef(null)

  async function request(path, options = {}) {
    const response = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  async function loadTasks() {
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
  }

  async function loadStickyNotes() {
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
  }

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
  }

  async function loadLinkCollection() {
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
  }

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
  }

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
    } catch {
      setLinkCollectionError('Dateipfad oder Programm konnte nicht geoeffnet werden.')
    }
  }

  async function loadMarketIndices() {
    try {
      const data = await request('/api/markets/indices')
      setMarketIndices(data)
      setMarketStatus('')
    } catch {
      setMarketStatus('Marktdaten konnten nicht geladen werden.')
    }
  }

  useEffect(() => {
    loadTasks()
    loadStickyNotes()
    loadLinkCollection()
    loadMarketIndices()
  }, [])

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
  }, [stickyNotes])

  useEffect(() => {
    const controller = new AbortController()

    if (!navigator.geolocation) {
      setWeatherStatus('Standort ist im Browser nicht verfügbar.')
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
    window.addEventListener('beforeunload', cleanupDoneTasks)

    return () => {
      window.removeEventListener('beforeunload', cleanupDoneTasks)
      Object.values(leavingTimeouts.current).forEach((timeoutId) =>
        clearTimeout(timeoutId),
      )
    }
  }, [])

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

  async function saveStickyNote(note) {
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

  function cleanupDoneTasks() {
    return fetch('/api/tasks/cleanup-completed', {
      method: 'POST',
      keepalive: true,
    })
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
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedTaskId(task.id)
                }
              }}
              role="button"
              tabIndex={0}
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
          <div className="links-grid">
            {linkCategories.map((category) => {
              const categoryTiles = linkTiles.filter(
                (tile) => tile.categoryId === category.id,
              )

              return (
                <section
                  className="link-column"
                  aria-label={`${category.name || 'Neue Kategorie'} links`}
                  key={category.id}
                >
                  <header className="link-category-header">
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
                              <span aria-hidden="true">FILE</span>
                            </button>
                          )}
                          <div className="link-tile-fields">
                            <input
                              type="text"
                              value={tile.title}
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
