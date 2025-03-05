"use client"

import { useEffect, useState } from "react"
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VoltageCurrentGraph() {
  const [gradient, setGradient] = useState<number | null>(null)
  const [intercept, setIntercept] = useState<number | null>(null)
  const [rSquared, setRSquared] = useState<number | null>(null)

  // Data from the table
  const data = [
    { voltage: 0.0, current: 0 },
    { voltage: 0.5, current: 9.33 },
    { voltage: 1.0, current: 23 },
    { voltage: 1.5, current: 24.66 },
    { voltage: 2.0, current: 47.66 },
    { voltage: 2.5, current: 60.66 },
    { voltage: 3.0, current: 71.66 },
    { voltage: 3.5, current: 85 },
    { voltage: 4.0, current: 95.66 },
  ]

  // Function to calculate linear regression
  const calculateLinearRegression = () => {
    const n = data.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0
    let sumYY = 0

    for (const point of data) {
      sumX += point.voltage
      sumY += point.current
      sumXY += point.voltage * point.current
      sumXX += point.voltage * point.voltage
      sumYY += point.current * point.current
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const meanY = sumY / n
    let totalVariation = 0
    let explainedVariation = 0

    for (const point of data) {
      const predictedY = slope * point.voltage + intercept
      totalVariation += Math.pow(point.current - meanY, 2)
      explainedVariation += Math.pow(predictedY - meanY, 2)
    }

    const rSquared = explainedVariation / totalVariation

    return { slope, intercept, rSquared }
  }

  // Generate points for the best fit line
  const generateBestFitLine = () => {
    if (gradient === null || intercept === null) return []

    const minVoltage = Math.min(...data.map((d) => d.voltage))
    const maxVoltage = Math.max(...data.map((d) => d.voltage))

    return [
      { voltage: minVoltage, current: minVoltage * gradient + intercept },
      { voltage: maxVoltage, current: maxVoltage * gradient + intercept },
    ]
  }

  useEffect(() => {
    const { slope, intercept, rSquared } = calculateLinearRegression()
    setGradient(slope)
    setIntercept(intercept)
    setRSquared(rSquared)
  }, [data])

  const bestFitLine = generateBestFitLine()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Voltage vs Current Graph</CardTitle>
        <CardDescription>Plotting the relationship between voltage (V) and current (A)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="voltage"
                name="Voltage"
                unit="V"
                label={{ value: "Voltage (V)", position: "bottom", offset: 20 }}
                domain={[0, "dataMax"]}
              />
              <YAxis
                type="number"
                dataKey="current"
                name="Current"
                unit="A"
                label={{ value: "Current (A)", angle: -90, position: "left", offset: -40 }}
                domain={[0, "dataMax"]}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${value} ${name === "current" ? "A" : "V"}`,
                  name === "current" ? "Current" : "Voltage",
                ]}
                labelFormatter={() => ""}
              />
              {/* Connected line through actual data points */}
              <Line
                name="Data Line"
                type="monotone"
                dataKey="current"
                data={data}
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: "#8884d8", r: 5 }}
              />
              {/* Best fit line */}
              {gradient !== null && intercept !== null && (
                <Line
                  name="Best Fit Line"
                  type="monotone"
                  dataKey="current"
                  data={bestFitLine}
                  stroke="#ff7300"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Gradient (Resistance)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">
                  {gradient !== null ? `${(1 / gradient).toFixed(2)} Ω` : "Calculating..."}
                </p>
                <p className="text-sm text-muted-foreground">Resistance = ΔV/ΔI</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Y-Intercept</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">
                  {intercept !== null ? `${intercept.toFixed(2)} A` : "Calculating..."}
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">R² Value</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold">{rSquared !== null ? rSquared.toFixed(4) : "Calculating..."}</p>
                <p className="text-sm text-muted-foreground">Goodness of fit (1.0 = perfect)</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md bg-muted p-4">
            <h3 className="mb-2 font-semibold">Calculation Method:</h3>
            <p>
              The gradient is calculated using linear regression across all data points. Since this is a voltage-current
              relationship, the resistance (R) is given by:
            </p>
            <p className="mt-2 font-medium">
              R = ΔV/ΔI ={" "}
              {gradient !== null ? `1/${gradient.toFixed(2)} = ${(1 / gradient).toFixed(2)} Ω` : "calculating..."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Note: In Ohm's law (V = IR), the gradient of a V-I graph is R, but since we're plotting I vs V, the
              gradient is 1/R.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

