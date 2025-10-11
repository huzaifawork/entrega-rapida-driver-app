import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle } from "lucide-react";

export default function HistoryFilters({ filters, onFiltersChange }) {
  return (
    <Card className="shadow-lg border-0">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.period === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({...filters, period: "today"})}
              >
                Hoje
              </Button>
              <Button
                variant={filters.period === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({...filters, period: "week"})}
              >
                Última Semana
              </Button>
              <Button
                variant={filters.period === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({...filters, period: "month"})}
              >
                Último Mês
              </Button>
              <Button
                variant={filters.period === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({...filters, period: "all"})}
              >
                Todos
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.status === "delivered" ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({...filters, status: "delivered"})}
              >
                Entregue
              </Button>
              <Button
                variant={filters.status === "cancelled" ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({...filters, status: "cancelled"})}
              >
                Cancelada
              </Button>
              <Button
                variant={filters.status === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersChange({...filters, status: "all"})}
              >
                Todos
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}