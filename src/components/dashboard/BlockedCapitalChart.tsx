import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface DataPoint {
  name: string;
  amount: number;
}

interface BlockedCapitalChartProps {
  data: DataPoint[];
}

const COLORS = ['#6366f1', '#6366f1', '#f59e0b', '#ef4444', '#991b1b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-4 border border-border/50 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label} Days Overdue</p>
        <p className="text-sm font-bold text-primary">₹{payload[0].value.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

export const BlockedCapitalChart: React.FC<BlockedCapitalChartProps> = ({ data }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.8} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar 
            dataKey="amount" 
            radius={[6, 6, 0, 0]}
            barSize={40}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
