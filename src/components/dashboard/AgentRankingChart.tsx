"use client";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface AgentData {
  agentName: string;
  monthlyData: number[];
  biglietteriaData: number[];
  tourBusData: number[];
  tourAereoData: number[];
}

interface AgentRankingChartProps {
  selectedYear: number;
}

export default function AgentRankingChart({ selectedYear }: AgentRankingChartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generar colores dinámicos para cada agente
  const generateColors = (count: number) => {
    const baseColors = [
      "#2a31d8", "#465fff", "#7592ff", "#c2d6ff", "#e0e7ff", 
      "#3b82f6", "#1d4ed8", "#1e40af", "#1e3a8a", "#312e81",
      "#7c3aed", "#a855f7", "#c084fc", "#e879f9", "#f0abfc",
      "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"
    ];
    const colors = [];
    
    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        colors.push(baseColors[i]);
      } else {
        // Generar colores adicionales si hay más agentes que colores base
        const hue = (i * 137.5) % 360; // Golden angle approximation
        const saturation = 70 + (i % 3) * 10; // Variar saturación
        const lightness = 50 + (i % 2) * 10; // Variar luminosidad
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
    }
    
    return colors;
  };

  const categories = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Fetch data when year changes
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Fetching data for year:', selectedYear);

        // Fetch all data sources once
        const [biglietteriaResponse, tourAereoResponse, tourBusResponse] = await Promise.all([
          fetch('/api/biglietteria'),
          fetch('/api/tour-aereo'),
          fetch('/api/tour-bus')
        ]);

        const [biglietteriaData, tourAereoData, tourBusData] = await Promise.all([
          biglietteriaResponse.json(),
          tourAereoResponse.json(),
          tourBusResponse.json()
        ]);

        // Get all unique agents from all sources
        const allAgents = new Set<string>();

        // Process BIGLIETTERIA data - Replicar lógica de BiglietteriaUserSalesChart
        const biglietteriaRecords = biglietteriaData.records || [];
        console.log('📊 Biglietteria - Total records:', biglietteriaRecords.length);
        
        // Debug: verificar fechas de los registros
        const recordYears = biglietteriaRecords.map(record => new Date(record.data).getFullYear());
        const uniqueYears = [...new Set(recordYears)];
        console.log('📅 Years in biglietteria data:', uniqueYears);
        
        biglietteriaRecords.forEach((record: any) => {
          // Usar la misma lógica que BiglietteriaUserSalesChart
          const userName = record.creator?.firstName 
            ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
            : record.creator?.email || 'Usuario';
          allAgents.add(userName);
        });

        // Process TOUR AEREO data - Replicar lógica de TourAereoUserSalesChart
        const tourAereoTours = tourAereoData.tours || [];
        console.log('✈️ Tour Aereo - Total tours:', tourAereoTours.length);
        
        // Debug: verificar fechas de los tours
        const tourAereoYears = tourAereoTours.map(tour => new Date(tour.fechaViaje).getFullYear());
        const uniqueTourAereoYears = [...new Set(tourAereoYears)];
        console.log('📅 Years in tour aereo data:', uniqueTourAereoYears);
        
        tourAereoTours.forEach((tour: any) => {
          // Usar la misma lógica que TourAereoUserSalesChart
          if (tour.ventas && tour.ventas.length > 0) {
            tour.ventas.forEach((venta: any) => {
              const userName = venta.creator?.firstName 
                ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                : venta.creator?.email || 'Usuario';
              allAgents.add(userName);
            });
          }
        });

        // Process TOUR BUS data - Replicar lógica de TourBusUserSalesChart
        const tourBusTours = tourBusData.tours || [];
        console.log('🚌 Tour Bus - Total tours:', tourBusTours.length);
        
        // Debug: verificar fechas de los tours
        const tourBusYears = tourBusTours.map(tour => new Date(tour.fechaViaje).getFullYear());
        const uniqueTourBusYears = [...new Set(tourBusYears)];
        console.log('📅 Years in tour bus data:', uniqueTourBusYears);
        
        tourBusTours.forEach((tour: any) => {
          // Usar la misma lógica que TourBusUserSalesChart
          if (tour.ventasTourBus && tour.ventasTourBus.length > 0) {
            tour.ventasTourBus.forEach((venta: any) => {
              const userName = venta.creator?.firstName 
                ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                : venta.creator?.email || 'Usuario';
              allAgents.add(userName);
            });
          }
        });

        // Convert to the format expected by the chart
        const chartData: AgentData[] = Array.from(allAgents).map(agentName => {
          const monthlyData = Array.from({ length: 12 }, (_, month) => {
            const startDate = new Date(selectedYear, month, 1);
            const endDate = new Date(selectedYear, month + 1, 0, 23, 59, 59);
            
            let totalSales = 0;
            
            // Count BIGLIETTERIA sales for this agent and month - Replicar lógica exacta
            const biglietteriaSales = biglietteriaRecords.filter((record: any) => {
              const recordDate = new Date(record.data);
              const userName = record.creator?.firstName 
                ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
                : record.creator?.email || 'Usuario';
              const agentMatch = userName === agentName;
              return recordDate >= startDate && recordDate <= endDate && agentMatch;
            }).length;

            // Count TOUR AEREO sales for this agent and month - Replicar lógica exacta
            let tourAereoSales = 0;
            tourAereoTours.forEach((tour: any) => {
              const tourDate = new Date(tour.fechaViaje);
              if (tourDate >= startDate && tourDate <= endDate) {
                if (tour.ventas && tour.ventas.length > 0) {
                  tour.ventas.forEach((venta: any) => {
                    const userName = venta.creator?.firstName 
                      ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                      : venta.creator?.email || 'Usuario';
                    if (userName === agentName) {
                      tourAereoSales++;
                    }
                  });
                }
              }
            });

            // Count TOUR BUS sales for this agent and month - Replicar lógica exacta
            let tourBusSales = 0;
            tourBusTours.forEach((tour: any) => {
              const tourDate = new Date(tour.fechaViaje);
              if (tourDate >= startDate && tourDate <= endDate) {
                if (tour.ventasTourBus && tour.ventasTourBus.length > 0) {
                  tour.ventasTourBus.forEach((venta: any) => {
                    const userName = venta.creator?.firstName 
                      ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                      : venta.creator?.email || 'Usuario';
                    if (userName === agentName) {
                      tourBusSales++;
                    }
                  });
                }
              }
            });

            return biglietteriaSales + tourAereoSales + tourBusSales;
          });

          const biglietteriaData = Array.from({ length: 12 }, (_, month) => {
            const startDate = new Date(selectedYear, month, 1);
            const endDate = new Date(selectedYear, month + 1, 0, 23, 59, 59);
            
            return biglietteriaRecords.filter((record: any) => {
              const recordDate = new Date(record.data);
              const userName = record.creator?.firstName 
                ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
                : record.creator?.email || 'Usuario';
              const agentMatch = userName === agentName;
              return recordDate >= startDate && recordDate <= endDate && agentMatch;
            }).length;
          });

          const tourAereoData = Array.from({ length: 12 }, (_, month) => {
            const startDate = new Date(selectedYear, month, 1);
            const endDate = new Date(selectedYear, month + 1, 0, 23, 59, 59);
            
            let sales = 0;
            tourAereoTours.forEach((tour: any) => {
              const tourDate = new Date(tour.fechaViaje);
              if (tourDate >= startDate && tourDate <= endDate) {
                if (tour.ventas && tour.ventas.length > 0) {
                  tour.ventas.forEach((venta: any) => {
                    const userName = venta.creator?.firstName 
                      ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                      : venta.creator?.email || 'Usuario';
                    if (userName === agentName) {
                      sales++;
                    }
                  });
                }
              }
            });
            return sales;
          });

          const tourBusData = Array.from({ length: 12 }, (_, month) => {
            const startDate = new Date(selectedYear, month, 1);
            const endDate = new Date(selectedYear, month + 1, 0, 23, 59, 59);
            
            let sales = 0;
            tourBusTours.forEach((tour: any) => {
              const tourDate = new Date(tour.fechaViaje);
              if (tourDate >= startDate && tourDate <= endDate) {
                if (tour.ventasTourBus && tour.ventasTourBus.length > 0) {
                  tour.ventasTourBus.forEach((venta: any) => {
                    const userName = venta.creator?.firstName 
                      ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                      : venta.creator?.email || 'Usuario';
                    if (userName === agentName) {
                      sales++;
                    }
                  });
                }
              }
            });
            return sales;
          });

          return {
            agentName,
            monthlyData,
            biglietteriaData,
            tourAereoData,
            tourBusData
          };
        });

        console.log('Agent Data for Chart:', chartData);
        console.log('Number of agents found:', chartData.length);
        console.log('Agent names:', chartData.map(agent => agent.agentName));
        
        // Debug: mostrar datos de cada agente
        chartData.forEach((agent, index) => {
          console.log(`Agent ${index + 1}: ${agent.agentName}`);
          console.log(`  Monthly data:`, agent.monthlyData);
          console.log(`  Total sales:`, agent.monthlyData.reduce((a, b) => a + b, 0));
        });
        
        setAgentData(chartData);
      } catch (err) {
        console.error('Error fetching agent data:', err);
        setError('Error al cargar datos de agentes');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, [selectedYear]);

  const chartOptions: ApexOptions = useMemo(() => ({
    colors: generateColors(agentData?.length || 0),
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
        stacked: true,
      height: 315,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 10,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontSize: "14px",
      fontWeight: 400,
      markers: {
        size: 5,
        shape: "circle",
        strokeWidth: 0,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0,
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => val.toString(),
      },
    },
  }), [categories, agentData?.length || 0, agentData]);

  const series = useMemo(() => {
    if (!agentData || !Array.isArray(agentData)) {
      return [];
    }
    const seriesData = agentData.map(agent => ({
      name: agent.agentName,
      data: agent.monthlyData
    }));
    console.log('Series Data for Chart:', seriesData);
    console.log('Number of series:', seriesData.length);
    console.log('Series names:', seriesData.map(s => s.name));
    return seriesData;
  }, [agentData]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!agentData || agentData.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="text-center text-gray-500 py-8">
          <p>No hay datos de agentes disponibles para {selectedYear}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ranking Agente
        </h3>
        <div className="relative h-fit">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[700px] xl:min-w-full pl-2">
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={315}
          />
        </div>
      </div>
    </div>
  );
}