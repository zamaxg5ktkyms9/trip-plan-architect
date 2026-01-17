'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DeepPartial } from 'ai'
import type { ScouterResponse } from '@/types/plan'
import { MapPin, ShoppingCart, Copy, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface MissionBriefingProps {
  mission: DeepPartial<ScouterResponse>
}

export function MissionBriefing({ mission }: MissionBriefingProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const copyMissionText = () => {
    if (!mission.mission_title) return

    let text = `=== MISSION BRIEFING ===\n\n`
    text += `OPERATION: ${mission.mission_title}\n\n`
    text += `BRIEFING:\n${mission.intro}\n\n`

    if (mission.target_spot) {
      text += `TARGET LOCATION:\n`
      text += `- ${mission.target_spot.n}\n`
      text += `- SEARCH: ${mission.target_spot.q}\n\n`
    }

    if (mission.atmosphere) {
      text += `LOCATION ANALYSIS:\n${mission.atmosphere}\n\n`
    }

    if (mission.quests && mission.quests.length > 0) {
      text += `MISSION OBJECTIVES:\n`
      mission.quests.forEach((quest, i) => {
        if (!quest) return
        text += `\n[${i + 1}] ${quest.t}\n`
        text += `${quest.d}\n`
        text += `GEAR: ${quest.gear}\n`
      })
      text += `\n`
    }

    if (mission.affiliate) {
      text += `RECOMMENDED EQUIPMENT:\n`
      text += `- ${mission.affiliate.item}\n`
      text += `- ${mission.affiliate.reason}\n`
    }

    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('MISSION BRIEFING COPIED', {
      description: 'Data transferred to clipboard.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const openGoogleMaps = () => {
    if (!mission.target_spot?.q) return
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mission.target_spot.q)}`
    window.open(mapsUrl, '_blank', 'noopener,noreferrer')
  }

  const searchAmazon = () => {
    if (!mission.affiliate?.q) return
    const amazonUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(mission.affiliate.q)}`
    window.open(amazonUrl, '_blank', 'noopener,noreferrer')
  }

  const searchRakuten = () => {
    if (!mission.affiliate?.q) return
    const rakutenUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(mission.affiliate.q)}/`
    window.open(rakutenUrl, '_blank', 'noopener,noreferrer')
  }

  // Show loading state for streaming
  const hasAnyContent = mission.mission_title || mission.intro
  if (!hasAnyContent) {
    return (
      <div className="terminal-theme min-h-screen p-4 terminal-scanlines">
        <div className="max-w-4xl mx-auto">
          <div className="terminal-panel">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
              <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full animation-delay-150" />
              <div className="w-2 h-2 bg-green-500 animate-pulse rounded-full animation-delay-300" />
              <span className="terminal-text-secondary ml-2">
                COMPILING MISSION DATA...
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="terminal-theme min-h-screen p-4 sm:p-6 terminal-scanlines">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="terminal-panel hud-corners">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs terminal-text-secondary mb-1">
                [ ENGINEER&apos;S SCOUTER v2.0 ]
              </div>
              <h1 className="terminal-heading">
                {mission.mission_title || 'LOADING...'}
              </h1>
            </div>
            <button
              onClick={copyMissionText}
              className="terminal-button text-xs px-3 py-2"
              title="Copy mission data"
            >
              <Copy className="w-4 h-4 inline mr-1" />
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>

          {mission.intro && (
            <div className="terminal-body border-l-2 border-green-500/50 pl-4 py-2 bg-green-500/5">
              {mission.intro}
            </div>
          )}
        </div>

        {/* Target Location */}
        {mission.target_spot && (
          <div className="terminal-panel">
            <h2 className="terminal-subheading mb-3">
              <MapPin className="inline w-5 h-5 mr-2" />
              TARGET LOCATION
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs terminal-text-secondary">
                  SITE NAME:
                </div>
                <div className="terminal-body">
                  {mission.target_spot.n || 'UNKNOWN'}
                </div>
              </div>
              <div>
                <div className="text-xs terminal-text-secondary">
                  SEARCH QUERY:
                </div>
                <div className="terminal-body font-normal">
                  {mission.target_spot.q || 'N/A'}
                </div>
              </div>
              {mission.target_spot.q && (
                <button
                  onClick={openGoogleMaps}
                  className="terminal-button-amber w-full sm:w-auto"
                >
                  <MapPin className="inline w-4 h-4 mr-2" />
                  LOCATE ON MAP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location Analysis */}
        {mission.atmosphere && (
          <div className="terminal-panel">
            <h2 className="terminal-subheading mb-3">LOCATION ANALYSIS</h2>
            <div className="terminal-body leading-relaxed">
              {mission.atmosphere}
            </div>
          </div>
        )}

        {/* Mission Objectives */}
        {mission.quests && mission.quests.length > 0 && (
          <div className="terminal-panel">
            <h2 className="terminal-subheading mb-4">MISSION OBJECTIVES</h2>
            <div className="space-y-4">
              {mission.quests.map((quest, index) => {
                if (!quest) return null
                return (
                  <div
                    key={index}
                    className="border border-green-500/30 p-4 bg-green-500/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="terminal-text-amber font-bold text-lg shrink-0">
                        [{index + 1}]
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="terminal-subheading text-sm">
                          {quest.t || 'OBJECTIVE'}
                        </div>
                        <div className="terminal-body text-sm">
                          {quest.d || 'No details provided.'}
                        </div>
                        {quest.gear && (
                          <div className="text-xs terminal-text-secondary mt-2 pt-2 border-t border-green-500/20">
                            <span className="terminal-text-amber">
                              RECOMMENDED GEAR:
                            </span>{' '}
                            {quest.gear}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gear Acquisition */}
        {mission.affiliate && (
          <div className="terminal-panel">
            <h2 className="terminal-subheading mb-3">
              <ShoppingCart className="inline w-5 h-5 mr-2" />
              EQUIPMENT ACQUISITION
            </h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs terminal-text-secondary">ITEM:</div>
                <div className="terminal-body">
                  {mission.affiliate.item || 'N/A'}
                </div>
              </div>
              {mission.affiliate.reason && (
                <div>
                  <div className="text-xs terminal-text-secondary">
                    RECOMMENDATION:
                  </div>
                  <div className="terminal-body text-sm">
                    {mission.affiliate.reason}
                  </div>
                </div>
              )}
              {mission.affiliate.q && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={searchAmazon}
                    className="terminal-button-amber flex-1"
                  >
                    <ShoppingCart className="inline w-4 h-4 mr-2" />
                    ACQUIRE (AMAZON)
                  </button>
                  <button
                    onClick={searchRakuten}
                    className="terminal-button-amber flex-1"
                  >
                    <ShoppingCart className="inline w-4 h-4 mr-2" />
                    ACQUIRE (RAKUTEN)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset Button */}
        <div className="terminal-panel">
          <button
            onClick={() => router.push('/')}
            className="terminal-button w-full"
          >
            <ArrowLeft className="inline w-4 h-4 mr-2" />
            NEW MISSION CONFIG
          </button>
        </div>
      </div>
    </div>
  )
}
