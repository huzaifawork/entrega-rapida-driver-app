
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Save, XCircle, Truck, Building } from "lucide-react";

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

export default function VehicleForm({ vehicle, onSubmit, onCancel, warehouses }) {
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type: '',
    warehouse_id: '',
    brand: '',
    model: '',
    year: '',
    max_weight_kg: '',
    cargo_length_m: '',
    cargo_width_m: '',
    cargo_height_m: '',
    has_crane: false,
    crane_reach_m: '',
    crane_capacity_kg: '',
    has_tipper: false,
    has_tailgate: false,
    insurance_expiry: '',
    inspection_expiry: '',
    cost_per_km: '',
    cost_per_hour: '',
    base_freight_cost: ''
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        license_plate: vehicle.license_plate || '',
        vehicle_type: vehicle.vehicle_type || '',
        warehouse_id: vehicle.warehouse_id || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        max_weight_kg: vehicle.max_weight_kg || '',
        cargo_length_m: vehicle.cargo_length_m || '',
        cargo_width_m: vehicle.cargo_width_m || '',
        cargo_height_m: vehicle.cargo_height_m || '',
        has_crane: vehicle.has_crane || false,
        crane_reach_m: vehicle.crane_reach_m || '',
        crane_capacity_kg: vehicle.crane_capacity_kg || '',
        has_tipper: vehicle.has_tipper || false,
        has_tailgate: vehicle.has_tailgate || false,
        insurance_expiry: vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toISOString().split('T')[0] : '',
        inspection_expiry: vehicle.inspection_expiry ? new Date(vehicle.inspection_expiry).toISOString().split('T')[0] : '',
        cost_per_km: vehicle.cost_per_km || '',
        cost_per_hour: vehicle.cost_per_hour || '',
        base_freight_cost: vehicle.base_freight_cost || ''
      });
    }
  }, [vehicle]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id, checked) => {
    setFormData(prev => ({ ...prev, [id]: checked }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const processedData = { ...formData };
    
    const numberFields = [
      'year', 
      'max_weight_kg', 
      'cargo_length_m', 
      'cargo_width_m', 
      'cargo_height_m', 
      'crane_reach_m', 
      'crane_capacity_kg',
      'cost_per_km',
      'cost_per_hour',
      'base_freight_cost'
    ];
    
    numberFields.forEach(field => {
      const value = processedData[field];
      if (value === '' || value === null || value === undefined) {
        // Se o campo estiver vazio, não o enviamos.
        // O `delete` remove a chave completamente se o valor for vazio, null ou undefined
        // Isso é útil para APIs que esperam a ausência da chave ou null, em vez de uma string vazia para números.
        delete processedData[field];
      } else {
        // Caso contrário, garantimos que é um número.
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          // Se não for um número válido após tentativa de parse, também removemos o campo
          delete processedData[field];
        } else {
          processedData[field] = parsed;
        }
      }
    });

    // Para as datas e warehouse_id, uma string vazia deve ser nula
    if (processedData.insurance_expiry === '') {
      processedData.insurance_expiry = null;
    }
    if (processedData.inspection_expiry === '') {
      processedData.inspection_expiry = null;
    }
    if (processedData.warehouse_id === '') {
      processedData.warehouse_id = null;
    }

    onSubmit(processedData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            {vehicle ? "Editar Veículo" : "Adicionar Novo Veículo"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Coluna Esquerda */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="license_plate">Matrícula</Label>
                  <Input id="license_plate" value={formData.license_plate} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
                  <Select value={formData.vehicle_type} onValueChange={(value) => handleSelectChange('vehicle_type', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(vehicleTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouse_id">Armazém Base</Label>
                  <Select value={formData.warehouse_id} onValueChange={(value) => handleSelectChange('warehouse_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Associar a um armazém..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses && warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            {wh.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input id="brand" value={formData.brand} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input id="model" value={formData.model} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Input id="year" type="number" value={formData.year} onChange={handleInputChange} />
                </div>
              </div>
              {/* Coluna Direita */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max_weight_kg">Peso Máximo (kg)</Label>
                  <Input id="max_weight_kg" type="number" value={formData.max_weight_kg} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="cargo_length_m">Comp. (m)</Label>
                    <Input id="cargo_length_m" type="number" value={formData.cargo_length_m} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo_width_m">Larg. (m)</Label>
                    <Input id="cargo_width_m" type="number" value={formData.cargo_width_m} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo_height_m">Alt. (m)</Label>
                    <Input id="cargo_height_m" type="number" value={formData.cargo_height_m} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Características Especiais</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="has_crane" checked={formData.has_crane} onCheckedChange={(checked) => handleCheckboxChange('has_crane', checked)} />
                      <label htmlFor="has_crane" className="text-sm font-medium">Tem Grua</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="has_tipper" checked={formData.has_tipper} onCheckedChange={(checked) => handleCheckboxChange('has_tipper', checked)} />
                      <label htmlFor="has_tipper" className="text-sm font-medium">Tem Basculante</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="has_tailgate" checked={formData.has_tailgate} onCheckedChange={(checked) => handleCheckboxChange('has_tailgate', checked)} />
                      <label htmlFor="has_tailgate" className="text-sm font-medium">Tem Elevador Traseiro</label>
                    </div>
                  </div>
                </div>
                {formData.has_crane && (
                  <div className="grid grid-cols-2 gap-2 bg-blue-50 p-3 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="crane_reach_m">Alcance Grua (m)</Label>
                      <Input id="crane_reach_m" type="number" value={formData.crane_reach_m} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="crane_capacity_kg">Capac. Grua (kg)</Label>
                      <Input id="crane_capacity_kg" type="number" value={formData.crane_capacity_kg} onChange={handleInputChange} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custos */}
            <div className="grid md:grid-cols-3 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="base_freight_cost">Custo Base por Frete (€)</Label>
                <Input id="base_freight_cost" type="number" step="0.01" value={formData.base_freight_cost} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_km">Custo Adicional por Km (€)</Label>
                <Input id="cost_per_km" type="number" step="0.01" value={formData.cost_per_km} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_hour">Custo por Hora (€)</Label>
                <Input id="cost_per_hour" type="number" step="0.01" value={formData.cost_per_hour} onChange={handleInputChange} />
              </div>
            </div>

            {/* Documentação */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="insurance_expiry">Vencimento do Seguro</Label>
                <Input id="insurance_expiry" type="date" value={formData.insurance_expiry} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspection_expiry">Vencimento da Inspeção</Label>
                <Input id="inspection_expiry" type="date" value={formData.inspection_expiry} onChange={handleInputChange} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Cancelar
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Salvar Veículo
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
