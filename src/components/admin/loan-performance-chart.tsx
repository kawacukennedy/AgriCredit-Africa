'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { month: 'Jan', loans: 120, repayment: 92 },
  { month: 'Feb', loans: 150, repayment: 94 },
  { month: 'Mar', loans: 180, repayment: 91 },
  { month: 'Apr', loans: 200, repayment: 95 },
  { month: 'May', loans: 220, repayment: 93 },
  { month: 'Jun', loans: 250, repayment: 96 },
  { month: 'Jul', loans: 280, repayment: 94 },
  { month: 'Aug', loans: 300, repayment: 97 },
  { month: 'Sep', loans: 320, repayment: 95 },
  { month: 'Oct', loans: 350, repayment: 98 },
  { month: 'Nov', loans: 380, repayment: 96 },
  { month: 'Dec', loans: 400, repayment: 97 },
];

export default function LoanPerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="loans" fill="#22c55e" name="Loans Funded" />
        <Line yAxisId="right" type="monotone" dataKey="repayment" stroke="#0ea5e9" strokeWidth={2} name="Repayment Rate (%)" />
      </BarChart>
    </ResponsiveContainer>
  );
}