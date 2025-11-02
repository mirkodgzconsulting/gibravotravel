"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface BiglietteriaFeeCardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  userId?: string;
}

interface AgentFeeData {
  agentName: string;
  feeAmount: number;
}

export default function BiglietteriaFeeCard({ dateRange, userId }: BiglietteriaFeeCardProps) {
  const [agentFees, setAgentFees] = useState<AgentFeeData[]>([]);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBiglietteriaFeeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;

        const userIdParam = userId ? `?userId=${userId}` : '';
        const response = await fetch(`/api/biglietteria${userIdParam}`);
        const data = await response.json();
        const records = data.records || [];

        // Filter records by date
        const filteredRecords = records.filter((record: any) => {
          const recordDate = new Date(record.data);
          return recordDate >= startDate && recordDate <= endDate;
        });

        // Group by agent and sum fees
        const agentFeeMap = new Map<string, number>();
        let total = 0;

        filteredRecords.forEach((record: any) => {
          const agentName = record.creator?.firstName 
            ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
            : record.creator?.email || 'Usuario';
          
          const feeAmount = record.feeAgv || 0;
          
          if (agentFeeMap.has(agentName)) {
            agentFeeMap.set(agentName, agentFeeMap.get(agentName)! + feeAmount);
          } else {
            agentFeeMap.set(agentName, feeAmount);
          }
          
          total += feeAmount;
        });

        const agentFeesArray: AgentFeeData[] = Array.from(agentFeeMap.entries()).map(([agentName, feeAmount]) => ({
          agentName,
          feeAmount
        }));

        // Sort by fee amount descending
        agentFeesArray.sort((a, b) => b.feeAmount - a.feeAmount);

        setAgentFees(agentFeesArray);
        setTotalFee(total);
      } catch (error) {
        console.error('Error fetching biglietteria fee data:', error);
        setError('Error al cargar datos de fees');
      } finally {
        setLoading(false);
      }
    };

    fetchBiglietteriaFeeData();
  }, [dateRange, userId]);

  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 200,
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#2a31d8", "#465fff", "#7592ff", "#c2d6ff"], // Azul progresivo
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          background: 'transparent',
        }
      }
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    series: agentFees.map(agent => agent.feeAmount),
    labels: agentFees.map(agent => agent.agentName),
  }), [agentFees]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
        
        {/* Agents skeleton */}
        <div className="space-y-2 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
        
        {/* Chart skeleton */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
        
        {/* Total skeleton */}
        <div className="flex items-center justify-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          BIGLIETTERIA
        </h3>
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {agentFees.map((agent, index) => (
          <div key={agent.agentName} className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {agent.agentName}:
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {agent.feeAmount.toLocaleString()}€
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="w-32 h-32">
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series}
            type="donut"
            height={200}
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span className="text-2xl font-bold text-gray-800 dark:text-white">
            {totalFee.toLocaleString()}€
          </span>
        </div>
      </div>
    </div>
  );
}
