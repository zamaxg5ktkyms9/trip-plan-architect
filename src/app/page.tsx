'use client'

import { useState } from 'react'
import { useObject } from 'ai/react'
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
import { FooterAd } from '@/components/footer-ad'

export default function Home() {
  const [destination, setDestination] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('leisure')
  const [period, setPeriod] = useState('3')
  const [arrivalTime, setArrivalTime] = useState('10:00')
  const [budget, setBudget] = useState('standard')

  const { object, submit, isLoading } = useObject({
    api: '/api/generate',
    schema: PlanSchema,
  })

  const handleGenerate = async () => {
    if (!destination.trim()) return

    await submit({
      destination,
      template: selectedTemplate,
      options: {
        period,
        arrivalTime,
        budget,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ✈️ Trip Plan Architect
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered travel itinerary generator
          </p>
        </header>

        {!object ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Create Your Perfect Trip</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Destination Input */}
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

              {/* Template Selection */}
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

              {/* Detail Options Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger>Detailed Options</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {/* Period */}
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

                    {/* Arrival Time */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Arrival Time
                      </label>
                      <Input
                        type="time"
                        value={arrivalTime}
                        onChange={e => setArrivalTime(e.target.value)}
                      />
                    </div>

                    {/* Budget */}
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

              {/* Generate Button */}
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
            </CardContent>
          </Card>
        ) : (
          <ResultView plan={object} destination={destination} />
        )}

        <FooterAd />
      </div>
    </div>
  )
}
