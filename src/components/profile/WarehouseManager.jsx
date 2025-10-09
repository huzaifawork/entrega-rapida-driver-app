import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Warehouse } from "@/api/entities";
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock,
  Truck,
  Navigation,
  Map,
  Minus,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corrigir ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const warehouseIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

export default function WarehouseManager({ user }) {
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [mapCenter, setMapCenter] = useState([38.7223, -9.1393]); // Lisboa por defeito
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    operating_radius_km: 25,
    warehouse_type: 'secondary',
    capacity_vehicles: '',
    has_loading_dock: false,
    has_crane: false,
    operating_hours_start: '08:00',
    operating_hours_end: '18:00',
    contact_person: '',
    contact_phone: '',
    latitude: 38.7223,
    longitude: -9.1393
  });

  const loadWarehouses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const userWarehouses = await Warehouse.filter({ owner_id: user.id }, "-created_date");
      setWarehouses(userWarehouses);
    } catch (error) {
      console.error("Erro ao carregar armazéns:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: `Localização: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const warehouseData = {
        ...formData,
        owner_id: user.id,
        capacity_vehicles: formData.capacity_vehicles ? parseInt(formData.capacity_vehicles) : null
      };

      if (editingWarehouse) {
        await Warehouse.update(editingWarehouse.id, warehouseData);
      } else {
        await Warehouse.create(warehouseData);
      }

      setShowForm(false);
      setEditingWarehouse(null);
      resetForm();
      loadWarehouses();
    } catch (error) {
      console.error("Erro ao salvar armazém:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      operating_radius_km: 25,
      warehouse_type: 'secondary',
      capacity_vehicles: '',
      has_loading_dock: false,
      has_crane: false,
      operating_hours_start: '08:00',
      operating_hours_end: '18:00',
      contact_person: '',
      contact_phone: '',
      latitude: 38.7223,
      longitude: -9.1393
    });
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name || '',
      address: warehouse.address || '',
      operating_radius_km: warehouse.operating_radius_km || 25,
      warehouse_type: warehouse.warehouse_type || 'secondary',
      capacity_vehicles: warehouse.capacity_vehicles || '',
      has_loading_dock: warehouse.has_loading_dock || false,
      has_crane: warehouse.has_crane || false,
      operating_hours_start: warehouse.operating_hours_start || '08:00',
      operating_hours_end: warehouse.operating_hours_end || '18:00',
      contact_person: warehouse.contact_person || '',
      contact_phone: warehouse.contact_phone || '',
      latitude: warehouse.latitude || 38.7223,
      longitude: warehouse.longitude || -9.1393
    });
    setMapCenter([warehouse.latitude || 38.7223, warehouse.longitude || -9.1393]);
    setShowForm(true);
  };

  const handleDelete = async (warehouseId) => {
    if (confirm("Tem certeza que deseja eliminar este armazém?")) {
      try {
        await Warehouse.delete(warehouseId);
        loadWarehouses();
      } catch (error) {
        console.error("Erro ao eliminar armazém:", error);
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude,
            address: "Localização Atual (ajustar endereço)"
          }));
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          alert("Não foi possível obter a localização.");
        }
      );
    }
  };

  const warehouseTypeLabels = {
    main: "Principal",
    secondary: "Secundário", 
    pickup_point: "Ponto de Retirada"
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            Gestão de Armazéns
          </CardTitle>
          <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Armazém
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulário de Armazém com Mapa Interativo */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-6"
            >
              <Card className="border border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {editingWarehouse ? "Editar Armazém" : "Novo Armazém"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="warehouse_name">Nome do Armazém</Label>
                        <Input
                          id="warehouse_name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="warehouse_type">Tipo</Label>
                        <Select
                          value={formData.warehouse_type}
                          onValueChange={(value) => setFormData(prev => ({...prev, warehouse_type: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(warehouseTypeLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="warehouse_address">Endereço</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={getCurrentLocation}
                        >
                          <Navigation className="w-4 h-4 mr-1" />
                          GPS
                        </Button>
                      </div>
                      <Input
                        id="warehouse_address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                        required
                      />
                    </div>

                    {/* Mapa Interativo para Seleção de Localização */}
                    <div className="space-y-3">
                      <Label>Localização no Mapa</Label>
                      <p className="text-sm text-gray-600">Clique no mapa para selecionar a localização exacta do armazém</p>
                      <div className="w-full h-80 bg-gray-200 rounded-lg overflow-hidden border-2 border-purple-200">
                        <MapContainer 
                          center={mapCenter} 
                          zoom={12} 
                          style={{ height: '100%', width: '100%' }}
                          eventHandlers={{
                            click: handleMapClick
                          }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                          />
                          <Marker 
                            position={[formData.latitude, formData.longitude]} 
                            icon={warehouseIcon}
                            draggable={true}
                            eventHandlers={{
                              dragend: (e) => {
                                const { lat, lng } = e.target.getLatLng();
                                setFormData(prev => ({...prev, latitude: lat, longitude: lng}));
                              }
                            }}
                          >
                            <Popup>
                              <div className="text-center">
                                <h4 className="font-semibold">{formData.name || "Novo Armazém"}</h4>
                                <p className="text-sm">Arraste para ajustar posição</p>
                              </div>
                            </Popup>
                          </Marker>
                          <Circle 
                            center={[formData.latitude, formData.longitude]} 
                            radius={formData.operating_radius_km * 1000}
                            pathOptions={{ 
                              color: 'purple', 
                              fillColor: 'purple', 
                              fillOpacity: 0.1 
                            }}
                          />
                        </MapContainer>
                      </div>
                    </div>

                    {/* Controlo do Raio */}
                    <div className="space-y-3">
                      <Label>Raio de Operação: {formData.operating_radius_km} km</Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData(prev => ({...prev, operating_radius_km: Math.max(5, prev.operating_radius_km - 5)}))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={formData.operating_radius_km}
                          onChange={(e) => setFormData(prev => ({...prev, operating_radius_km: parseInt(e.target.value)}))}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData(prev => ({...prev, operating_radius_km: Math.min(100, prev.operating_radius_km + 5)}))}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5km</span>
                        <span>50km</span>
                        <span>100km</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="capacity_vehicles">Capacidade (Veículos)</Label>
                        <Input
                          id="capacity_vehicles"
                          type="number"
                          value={formData.capacity_vehicles}
                          onChange={(e) => setFormData(prev => ({...prev, capacity_vehicles: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="operating_hours_start">Abertura</Label>
                        <Input
                          id="operating_hours_start"
                          type="time"
                          value={formData.operating_hours_start}
                          onChange={(e) => setFormData(prev => ({...prev, operating_hours_start: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="operating_hours_end">Fecho</Label>
                        <Input
                          id="operating_hours_end"
                          type="time"
                          value={formData.operating_hours_end}
                          onChange={(e) => setFormData(prev => ({...prev, operating_hours_end: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowForm(false);
                          setEditingWarehouse(null);
                          resetForm();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                        {editingWarehouse ? 'Atualizar' : 'Criar'} Armazém
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mapa Geral dos Armazéns */}
        {warehouses.length > 0 && (
          <Card className="border border-purple-200 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="w-5 h-5 text-purple-600" />
                Mapa dos Seus Armazéns
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                <MapContainer 
                  center={[38.7223, -9.1393]} 
                  zoom={7} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {warehouses.map((warehouse) => (
                    <React.Fragment key={warehouse.id}>
                      <Marker 
                        position={[warehouse.latitude, warehouse.longitude]} 
                        icon={warehouseIcon}
                      >
                        <Popup>
                          <div className="text-center">
                            <h4 className="font-semibold">{warehouse.name}</h4>
                            <p className="text-sm text-gray-600">{warehouse.address}</p>
                            <p className="text-xs text-purple-600">
                              Raio: {warehouse.operating_radius_km}km
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                      <Circle 
                        center={[warehouse.latitude, warehouse.longitude]} 
                        radius={warehouse.operating_radius_km * 1000}
                        pathOptions={{ 
                          color: warehouse.is_active ? 'purple' : 'gray', 
                          fillColor: warehouse.is_active ? 'purple' : 'gray', 
                          fillOpacity: 0.1 
                        }}
                      />
                    </React.Fragment>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Armazéns */}
        <div className="space-y-4">
          {warehouses.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum armazém registado
              </h3>
              <p className="text-gray-500">
                Adicione armazéns para expandir a sua área de operação
              </p>
            </div>
          ) : (
            warehouses.map((warehouse) => (
              <motion.div
                key={warehouse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                          <Badge className="bg-purple-100 text-purple-800">
                            {warehouseTypeLabels[warehouse.warehouse_type]}
                          </Badge>
                          {!warehouse.is_active && (
                            <Badge variant="outline" className="text-gray-500">Inativo</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{warehouse.address}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{warehouse.operating_radius_km}km raio</span>
                          </div>
                          {warehouse.capacity_vehicles && (
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>{warehouse.capacity_vehicles} veículos</span>
                            </div>
                          )}
                          {warehouse.operating_hours_start && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{warehouse.operating_hours_start}-{warehouse.operating_hours_end}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleEdit(warehouse)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => handleDelete(warehouse.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}