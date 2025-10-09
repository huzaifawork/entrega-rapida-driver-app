
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Truck, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Weight,
  Ruler,
  Construction // Alterado de Crane
} from "lucide-react";

const vehicleTypeLabels = {
  truck_small: "Camião Pequeno",
  truck_medium: "Camião Médio", 
  truck_large: "Camião Grande",
  van: "Carrinha",
  pickup: "Pickup",
  crane_truck: "Camião com Grua",
  tipper_truck: "Camião Basculante",
  flatbed: "Camião Plataforma"
};

export default function VehicleSelector({ vehicles, selectedVehicle, onVehicleSelect }) {
  if (vehicles.length === 0) {
    return (
      <Card className="shadow-lg border-0 border-l-4 border-l-orange-500">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Nenhum veículo registado</h3>
              <p className="text-gray-600 text-sm">Adicione pelo menos um veículo para começar a receber entregas</p>
            </div>
            <Link to={createPageUrl("Vehicles")}>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isVehicleValid = (vehicle) => {
    const now = new Date();
    const insuranceValid = !vehicle.insurance_expiry || new Date(vehicle.insurance_expiry) > now;
    const inspectionValid = !vehicle.inspection_expiry || new Date(vehicle.inspection_expiry) > now;
    return insuranceValid && inspectionValid && vehicle.is_active;
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-green-600" />
          Veículo Ativo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={selectedVehicle?.id || ""}
              onValueChange={(vehicleId) => {
                const vehicle = vehicles.find(v => v.id === vehicleId);
                onVehicleSelect(vehicle);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem 
                    key={vehicle.id} 
                    value={vehicle.id}
                    disabled={!isVehicleValid(vehicle)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{vehicleTypeLabels[vehicle.vehicle_type]} - {vehicle.license_plate}</span>
                      {!isVehicleValid(vehicle) && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Link to={createPageUrl("Vehicles")}>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Gerir Veículos
            </Button>
          </Link>
        </div>

        {selectedVehicle && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <span className="text-gray-600">Max:</span> {selectedVehicle.max_weight_kg}kg
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <span className="text-gray-600">Dim:</span> {selectedVehicle.cargo_length_m}x{selectedVehicle.cargo_width_m}x{selectedVehicle.cargo_height_m}m
                </span>
              </div>

              {selectedVehicle.has_crane && (
                <div className="flex items-center gap-2">
                  <Construction className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    <span className="text-gray-600">Grua:</span> {selectedVehicle.crane_reach_m}m / {selectedVehicle.crane_capacity_kg}kg
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isVehicleValid(selectedVehicle) ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {isVehicleValid(selectedVehicle) ? "Válido" : "Documentos expirados"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {selectedVehicle.has_crane && (
                <Badge className="bg-blue-100 text-blue-800">Grua</Badge>
              )}
              {selectedVehicle.has_tipper && (
                <Badge className="bg-green-100 text-green-800">Basculante</Badge>
              )}
              {selectedVehicle.has_tailgate && (
                <Badge className="bg-purple-100 text-purple-800">Elevador</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
