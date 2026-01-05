'use client'

import { useState, useEffect } from 'react'
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  TEMPLATES,
  PERIOD_OPTIONS,
  BUDGET_OPTIONS,
} from '@/lib/constants/templates'
import { PlanSchema } from '@/types/plan'
import { ResultView } from '@/components/result-view'
import { toast } from 'sonner'
import { debugLog, debugError } from '@/lib/debug'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X } from 'lucide-react'

export function TripGenerator() {
  const [destination, setDestination] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('leisure')
  const [period, setPeriod] = useState('3')
  const [arrivalTime, setArrivalTime] = useState('10:00')
  const [budget, setBudget] = useState('standard')
  const [showJapaneseNotice, setShowJapaneseNotice] = useState(true)

  const { object, submit, isLoading, error } = useObject({
    api: '/api/generate',
    schema: PlanSchema,
    onError: error => {
      debugError('[DEBUG] Generation error:', error)
      debugError('[DEBUG] Error type:', error.constructor.name)
      debugError('[DEBUG] Error message:', error.message)

      const errorMessage = error.message || 'An unexpected error occurred'

      if (errorMessage.includes('Rate limit exceeded')) {
        toast.error('Rate Limit Exceeded', {
          description: errorMessage,
          duration: 5000,
        })
      } else if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('504')
      ) {
        toast.error('Request Timeout', {
          description:
            'The request took too long to process. Please try again with a shorter itinerary.',
          duration: 5000,
        })
      } else if (errorMessage.includes('429')) {
        toast.error('Too Many Requests', {
          description: 'Please wait a moment before trying again.',
          duration: 5000,
        })
      } else {
        toast.error('Generation Failed', {
          description: errorMessage,
          duration: 5000,
        })
      }
    },
  })

  // Save plan when generation completes successfully
  useEffect(() => {
    const savePlan = async () => {
      // Only save when we have a complete plan and loading has finished
      if (
        object &&
        !isLoading &&
        object.title &&
        object.days &&
        object.target
      ) {
        debugLog('[DEBUG] Saving plan to database...')
        try {
          const response = await fetch('/api/plans', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(object),
          })

          const result = await response.json()

          if (result.success) {
            debugLog('[DEBUG] Plan saved successfully:', result.slug)
            toast.success('Plan Saved', {
              description: 'Your travel plan has been saved successfully!',
              duration: 3000,
            })
          } else {
            debugError('[DEBUG] Failed to save plan:', result.error)
            toast.error('Save Failed', {
              description: 'Plan generated but could not be saved to history.',
              duration: 5000,
            })
          }
        } catch (error) {
          debugError('[DEBUG] Error saving plan:', error)
          toast.error('Save Error', {
            description: 'Plan generated but could not be saved to history.',
            duration: 5000,
          })
        }
      }
    }

    savePlan()
  }, [object, isLoading])

  useEffect(() => {
    debugLog('[DEBUG] State Update:')
    debugLog('  - object:', object)
    debugLog('  - object type:', typeof object)
    debugLog('  - object keys:', object ? Object.keys(object) : 'null')
    debugLog('  - isLoading:', isLoading)
    debugLog('  - error:', error)
    debugLog('  - Current Mode:', !object ? 'INPUT FORM' : 'RESULT VIEW')
  }, [object, isLoading, error])

  const handleGenerate = async () => {
    debugLog('[DEBUG] handleGenerate called')
    debugLog('[DEBUG] Input data:', {
      destination,
      template: selectedTemplate,
      options: { period, arrivalTime, budget },
    })

    if (!destination.trim()) {
      toast.error('Destination Required', {
        description: 'Please enter a destination to generate an itinerary.',
      })
      return
    }

    try {
      debugLog('[DEBUG] Calling submit()...')
      await submit({
        destination,
        template: selectedTemplate,
        options: {
          period,
          arrivalTime,
          budget,
        },
      })
      debugLog('[DEBUG] submit() completed')
    } catch (err) {
      debugError('[DEBUG] Submit error:', err)
    }
  }

  return (
    <>
      {showJapaneseNotice && (
        <Alert className="mb-6 bg-muted/50 border-muted">
          <AlertDescription className="flex items-start justify-between gap-4">
            <span className="text-sm">
              🇯🇵 日本語でご利用の方へ:
              本アプリは英語ベースですが、ブラウザの翻訳機能を使用して日本語でご利用いただけます。
            </span>
            <button
              onClick={() => setShowJapaneseNotice(false)}
              className="shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {!object ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Create Your Perfect Trip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Input
                type="text"
                placeholder="e.g., Tokyo, Paris, New York..."
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Travel Style</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    variant={
                      selectedTemplate === template.id ? 'default' : 'outline'
                    }
                    className={`h-auto py-4 flex flex-col items-center gap-2 ${
                      selectedTemplate === template.id
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-xs">{template.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger>Detailed Options</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration</label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIOD_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Arrival Time</label>
                    <Input
                      type="time"
                      value={arrivalTime}
                      onChange={e => setArrivalTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget</label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button
              className="w-full h-12 text-lg"
              onClick={handleGenerate}
              disabled={!destination.trim() || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Itinerary ✨'
              )}
            </Button>

            <Accordion type="single" collapsible className="w-full mt-6">
              <AccordionItem value="disclaimer">
                <AccordionTrigger className="text-sm">
                  About & Limitations (Beta)
                </AccordionTrigger>
                <AccordionContent className="space-y-2 text-sm text-gray-600">
                  <p>
                    ⚠️ This is a <strong>Beta version</strong> powered by AI.
                    Information may be inaccurate or outdated.
                  </p>
                  <p>
                    📊 <strong>Usage limit:</strong> Approximately 100 plans per
                    day due to API restrictions.
                  </p>
                  <p>
                    ✈️ <strong>Important:</strong> Please verify all information
                    (opening hours, prices, availability) before your trip.
                  </p>
                  <p className="text-xs text-gray-500 mt-4">
                    Images provided by{' '}
                    <a
                      href="https://unsplash.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-700"
                    >
                      Unsplash
                    </a>
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ) : (
        <ResultView plan={object} destination={destination} />
      )}
    </>
  )
}
