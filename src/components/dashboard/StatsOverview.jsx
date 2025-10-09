import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Euro, Package, Star, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview({ user, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="shadow-lg border-0">
            <CardContent className="p-4">
              <Skeleton className="h-12 w-12 rounded-xl mb-3" />
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Hoje",
      value: `€${(user?.earnings_today || 0).toFixed(2)}`,
      icon: Euro,
      color: "bg-green-500",
      trend: "+15%"
    },
    {
      title: "Esta Semana", 
      value: `€${(user?.earnings_week || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "bg-blue-500",
      trend: "+8%"
    },
    {
      title: "Entregas Totais",
      value: user?.total_deliveries || 0,
      icon: Package,
      color: "bg-purple-500"
    },
    {
      title: "Avaliação",
      value: (user?.rating || 5.0).toFixed(1),
      icon: Star,
      color: "bg-yellow-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-lg border-0 overflow-hidden">
          <CardContent className="p-4 relative">
            <div className={`absolute top-0 right-0 w-20 h-20 ${stat.color} rounded-full opacity-10 transform translate-x-6 -translate-y-6`} />
            <div className="relative">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.trend && (
                <p className="text-xs text-green-600 font-medium mt-1">{stat.trend}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}