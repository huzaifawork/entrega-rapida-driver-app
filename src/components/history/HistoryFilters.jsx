import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Calendar, CheckCircle } from "lucide-react";

export default function HistoryFilters({ filters, onFiltersChange }) {
  return (
    <Card className="shadow-lg border-0">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select
              value={filters.period}
              onValueChange={(value) => onFiltersChange({...filters, period: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <CheckCircle className="w-4 h-4 text-gray-500" />
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({...filters, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}