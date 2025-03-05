"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Simple Card components to replace missing '@/components/ui/card'
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`card ${className}`} style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", margin: "16px 0" }}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`card-header ${className}`} style={{ marginBottom: "8px" }}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <h2 className={`card-title ${className}`} style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
      {children}
    </h2>
  );
};

const CardDescription = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <p className={`card-description ${className}`} style={{ fontSize: "1rem", color: "#666" }}>
      {children}
    </p>
  );
};

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return <div className={`card-content ${className}`} style={{ marginTop: "16px" }}>{children}</div>;
};

export default function VoltageCurrentGraph() {
  const [gradient, setGradient] = useState<number | null>(null);
  const [intercept, setIntercept] = useState<number | null>(null);
  const [rSquared, setRSquared] = useState<number | null>(null);

  // Data from the table
  const data = [
    { voltage: 0.0, current: 0.0 },
    { voltage: 0.5, current: 9.33 },
    { voltage: 1.0, current: 23.0 },
    { voltage: 1.5, current: 24.66 },
    { voltage: 2.0, current: 47.66 },
    { voltage: 2.5, current: 60.66 },
    { voltage: 3.0, current: 71.66 },
    { voltage: 3.5, current: 85.0 },
    { voltage: 4.0, current: 95.66 },
  ];

  // Function to calculate linear regression
  const calculateLinearRegression = useCallback(() => {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    for (const point of data) {
      sumX += point.voltage;
      sumY += point.current;
      sumXY += point.voltage * point.current;
      sumXX += point.voltage * point.voltage;
      sumYY += point.current * point.current;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let totalVariation = 0;
    let explainedVariation = 0;

    for (const point of data) {
      const predictedY = slope * point.voltage + intercept;
      totalVariation += Math.pow(point.current - meanY, 2);
      explainedVariation += Math.pow(predictedY - meanY, 2);
    }

    const rSquared = explainedVariation / totalVariation;

    return { slope, intercept, rSquared };
  }, [data]);

  // Generate points for the best fit line
  const generateBestFitLine = () => {
    if (gradient === null || intercept === null) return [];
    const minVoltage = Math.min(...data.map((d) => d.voltage));
    const maxVoltage = Math.max(...data.map((d) => d.voltage));
    return [
      { voltage: minVoltage, current: minVoltage * gradient + intercept },
      { voltage: maxVoltage, current: maxVoltage * gradient + intercept },
    ];
  };

  useEffect(() => {
    const { slope, intercept, rSquared } = calculateLinearRegression();
    setGradient(slope);
    setIntercept(intercept);
    setRSquared(rSquared);
  }, [calculateLinearRegression]);

  const bestFitLine = generateBestFitLine();

  // Custom dot component with label and error checking
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || typeof payload.voltage === "undefined" || typeof payload.current === "undefined") {
      return <circle cx={cx} cy={cy} r={5} fill="#8884d8" />;
    }
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="#8884d8" />
        <text x={cx} y={cy - 10} textAnchor="middle" fill="#666" fontSize="11px" fontWeight="500">
          {`(${payload.voltage.toFixed(1)}, ${payload.current.toFixed(2)})`}
        </text>
      </g>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Voltage vs Current Graph</CardTitle>
        <CardDescription>Plotting the relationship between voltage (V) and current (A)</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: "450px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 30, right: 30, bottom: 60, left: 70 }}>
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
                label={{ value: "Current (A)", angle: -90, position: "left", offset: -45 }}
                domain={[0, "dataMax"]}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip
                formatter={(value, name, props) => {
                  if (name === "current") {
                    return [`${Number(value).toFixed(2)} A`, "Current"];
                  }
                  return [`${Number(value).toFixed(2)} V`, "Voltage"];
                }}
                labelFormatter={() => ""}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Line
                name="Data Line"
                type="monotone"
                dataKey="current"
                data={data}
                stroke="#8884d8"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 8, fill: "#8884d8", stroke: "#fff" }}
              />
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

        <div style={{ marginTop: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            <Card>
              <CardHeader>
                <CardTitle>Gradient (Resistance)</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {gradient !== null ? `${(1 / gradient).toFixed(2)} Ω` : "Calculating..."}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#666" }}>Resistance = ΔV/ΔI</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Y-Intercept</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {intercept !== null ? `${intercept.toFixed(2)} A` : "Calculating..."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>R² Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ fontSize: "2rem", fontWeight: "bold" }}>
                  {rSquared !== null ? rSquared.toFixed(4) : "Calculating..."}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#666" }}>Goodness of fit (1.0 = perfect)</p>
              </CardContent>
            </Card>
          </div>

          <div style={{ marginTop: "32px", padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
            <h3 style={{ marginBottom: "8px", fontWeight: "bold" }}>Calculation Method:</h3>
            <p>
              The gradient is calculated using linear regression across all data points.
              Since this is a voltage-current relationship, the resistance (R) is given by:
            </p>
            <p style={{ marginTop: "8px", fontWeight: "500" }}>
              R = ΔV/ΔI ={" "}
              {gradient !== null ? `1/${gradient.toFixed(2)} = ${(1 / gradient).toFixed(2)} Ω` : "calculating..."}
            </p>
            <p style={{ marginTop: "8px", fontSize: "0.875rem", color: "#666" }}>
              Note: In Ohm's law (V = IR), the gradient of a V-I graph is R, but since we're plotting I vs V, the gradient is 1/R.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
