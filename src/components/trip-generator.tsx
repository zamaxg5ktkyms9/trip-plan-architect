'use client'

import { useState } from 'react'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { type ScouterResponse, ScouterResponseSchema } from '@/types/plan'
import { MissionBriefing } from '@/components/mission-briefing'
import { toast } from 'sonner'
import { debugLog, debugError } from '@/lib/debug'
import { Terminal, MapPin } from 'lucide-react'

// Mission types for the scouter
const MISSION_TYPES = [
  { id: 'photo', name: 'PHOTO', icon: '📷' },
  { id: 'sound', name: 'SOUND', icon: '🎵' },
  { id: 'video', name: 'VIDEO', icon: '🎬' },
  { id: 'chill', name: 'CHILL', icon: '🌿' },
]

const WORLD_LINES = [
  { id: 'cyberpunk', name: 'CYBERPUNK', desc: 'Neon + Steel' },
  { id: 'post-apocalypse', name: 'POST-APOCALYPSE', desc: 'Decay + Ruins' },
  { id: 'retro-future', name: 'RETRO-FUTURE', desc: 'Vintage Tech' },
  { id: 'nature', name: 'NATURE', desc: 'Raw Elements' },
]

export function TripGenerator() {
  const [destination, setDestination] = useState('')
  const [selectedWorldLine, setSelectedWorldLine] = useState('cyberpunk')
  const [selectedMissionType, setSelectedMissionType] = useState('photo')

  const { object, submit, isLoading } = useObject({
    api: '/api/generate',
    schema: ScouterResponseSchema,
    onFinish: async ({ object }) => {
      console.log('[Streaming] ✅ Finished')
      debugLog('[DEBUG] Stream finished with complete scouter response')
      debugLog('[DEBUG] Object:', object)

      // Save raw ScouterResponse (V2) to database
      if (object) {
        try {
          debugLog('[DEBUG] Saving V2 ScouterResponse to database...')

          const response = await fetch('/api/plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(object),
          })

          const result = await response.json()

          if (result.success) {
            debugLog('[DEBUG] ScouterResponse saved successfully:', result.slug)
            toast.success('MISSION ARCHIVED', {
              description: 'Data stored in database.',
              duration: 3000,
            })
          } else {
            debugError('[DEBUG] Failed to save ScouterResponse:', result.error)
            toast.error('ARCHIVE FAILED', {
              description: 'Mission generated but not saved.',
              duration: 5000,
            })
          }
        } catch (error) {
          debugError('[DEBUG] Error saving ScouterResponse:', error)
          toast.error('ARCHIVE ERROR', {
            description: 'Mission generated but not saved.',
            duration: 5000,
          })
        }
      }
    },
    onError: error => {
      debugError('[DEBUG] Generation error:', error)
      debugError('[DEBUG] Error type:', error.constructor?.name)
      debugError('[DEBUG] Error message:', error.message)

      const errorMessage = error.message || 'SYSTEM ERROR'

      if (
        errorMessage.includes('Rate limit exceeded') ||
        errorMessage.includes('429')
      ) {
        toast.error('RATE LIMIT EXCEEDED', {
          description: 'Too many requests. Try again later.',
          duration: 5000,
        })
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('504')
      ) {
        toast.error('REQUEST TIMEOUT', {
          description: 'Process took too long. Please retry.',
          duration: 5000,
        })
      } else {
        toast.error('GENERATION FAILED', {
          description: errorMessage,
          duration: 5000,
        })
      }
    },
  })

  const handleGenerate = async () => {
    debugLog('[DEBUG] handleGenerate called')
    debugLog('[DEBUG] Input data:', {
      destination,
      worldLine: selectedWorldLine,
      missionType: selectedMissionType,
    })

    if (!destination.trim()) {
      toast.error('TARGET SECTOR REQUIRED', {
        description: 'Enter a destination to compile mission.',
      })
      return
    }

    try {
      debugLog('[DEBUG] Calling submit()...')
      submit({
        destination,
        template: selectedMissionType, // Use mission type as template
        options: {
          worldLine: selectedWorldLine,
          missionType: selectedMissionType,
        },
      })
      debugLog('[DEBUG] submit() called')
    } catch (err) {
      debugError('[DEBUG] Submit error:', err)
    }
  }

  return (
    <>
      {!object && !isLoading ? (
        <div className="terminal-theme min-h-screen p-4 sm:p-6 terminal-scanlines">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="terminal-panel hud-corners">
              <div className="flex items-center gap-3 mb-2">
                <Terminal className="w-6 h-6 text-green-500" />
                <h1 className="terminal-heading">MISSION CONFIG</h1>
              </div>
              <div className="text-xs terminal-text-secondary">
                [ ENGINEER&apos;S SCOUTER v2.0 - BRIEFING SYSTEM ]
              </div>
            </div>

            {/* Target Sector Input */}
            <div className="terminal-panel">
              <label className="text-xs terminal-text-secondary mb-2 block uppercase tracking-wider">
                <MapPin className="inline w-3 h-3 mr-1" />
                TARGET SECTOR
              </label>
              <input
                type="text"
                placeholder="e.g., 川崎, 池袋, 横浜..."
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="terminal-input w-full text-base sm:text-lg"
                autoFocus
              />
              <div className="text-xs terminal-text-secondary mt-2">
                * Enter location name in Japanese or English
              </div>
            </div>

            {/* World Line Selection */}
            <div className="terminal-panel">
              <label className="text-xs terminal-text-secondary mb-3 block uppercase tracking-wider">
                WORLD LINE
              </label>
              <div className="grid grid-cols-2 gap-3">
                {WORLD_LINES.map(world => (
                  <button
                    key={world.id}
                    onClick={() => setSelectedWorldLine(world.id)}
                    className={`
                      border-2 p-3 rounded-none transition-all text-left
                      ${
                        selectedWorldLine === world.id
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-green-500/30 text-green-600 hover:border-green-500/50 hover:bg-green-500/5'
                      }
                    `}
                  >
                    <div className="font-mono text-sm font-bold uppercase">
                      {world.name}
                    </div>
                    <div className="text-xs terminal-text-secondary mt-1">
                      {world.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mission Type Selection */}
            <div className="terminal-panel">
              <label className="text-xs terminal-text-secondary mb-3 block uppercase tracking-wider">
                MISSION TYPE
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MISSION_TYPES.map(mission => (
                  <button
                    key={mission.id}
                    onClick={() => setSelectedMissionType(mission.id)}
                    className={`
                      border-2 p-4 rounded-none transition-all
                      ${
                        selectedMissionType === mission.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-green-500/30 text-green-600 hover:border-green-500/50 hover:bg-green-500/5'
                      }
                    `}
                  >
                    <div className="text-2xl mb-1">{mission.icon}</div>
                    <div className="font-mono text-xs uppercase font-bold">
                      {mission.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <div className="terminal-panel">
              <button
                onClick={handleGenerate}
                disabled={!destination.trim() || isLoading}
                className={`
                  w-full py-4 font-mono uppercase tracking-widest text-lg font-bold
                  border-2 rounded-none transition-all
                  ${
                    !destination.trim() || isLoading
                      ? 'border-green-900 text-green-900 cursor-not-allowed bg-black'
                      : 'border-green-500 text-green-400 hover:bg-green-500/20 active:bg-green-500/30'
                  }
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
                    <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full animation-delay-150" />
                    <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full animation-delay-300" />
                    <span className="ml-2">COMPILING...</span>
                  </span>
                ) : (
                  '[ EXECUTE MISSION ]'
                )}
              </button>
            </div>

            {/* Disclaimer */}
            <div className="terminal-panel">
              <details className="terminal-text-secondary text-xs">
                <summary className="cursor-pointer hover:text-green-500 uppercase tracking-wide mb-2">
                  ⚠ System Notice (Beta)
                </summary>
                <div className="space-y-2 pt-2 border-t border-green-500/20 terminal-body text-xs leading-relaxed">
                  <p>
                    • This is a BETA system. AI-generated data may be inaccurate
                    or outdated.
                  </p>
                  <p>
                    • RATE LIMIT: ~100 missions per day due to API constraints.
                  </p>
                  <p>
                    • IMPORTANT: Verify all location details (hours, fees,
                    reservations) before deployment.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      ) : object ? (
        <MissionBriefing mission={object as ScouterResponse} />
      ) : null}
    </>
  )
}
