
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Warehouse } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import {
  Map,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Target,
  Building,
  Clock,
  Truck,
  Save,
  X,
  Loader2,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Configuração dos ícones do Leaflet
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

const newLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Mapa de eventos para duplo clique - This will be used by the form's map
const MapEvents = ({ onDoubleClick }) => {
  useMapEvents({
    dblclick(e) {
      onDoubleClick(e);
    },
  });
  return null;
};

export default function InteractiveMap({ user }) {
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isGettingAddress, setIsGettingAddress] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([38.7223, -9.1393]); // Default to Lisbon for the main map
  const [mapKey, setMapKey] = useState(0); // To force re-render of Main MapContainer if needed

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    operating_radius_km: 25,
    warehouse_type: 'secondary',
    capacity_vehicles: '',
    operating_hours_start: '08:00',
    operating_hours_end: '18:00',
    contact_person: '',
    contact_phone: '',
    latitude: null, // Added for direct coordinate storage
    longitude: null  // Added for direct coordinate storage
  });

  // Ref para debounce da pesquisa (not used in outline but kept)
  const searchTimeoutRef = useRef(null);
  // This ref will now point to the *form's* Leaflet map instance, allowing programmatic control
  const formMapRef = useRef(null);

  const loadWarehouses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const userWarehouses = await Warehouse.filter({ owner_id: user.id }, "-created_date");
      setWarehouses(userWarehouses);

      // Definir centro do mapa principal baseado nos armazéns existentes
      if (userWarehouses.length > 0) {
        setMapCenter([userWarehouses[0].latitude, userWarehouses[0].longitude]);
      }
    } catch (error) {
      console.error("Erro ao carregar armazéns:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  // Geocoding reverso usando IA
  const getAddressFromCoordinates = async (lat, lng) => {
    setIsGettingAddress(true);
    try {
      const result = await InvokeLLM({
        prompt: `Determina a morada aproximada para as coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)} em Portugal.
        Responde apenas com a morada completa no formato: Rua/Avenida, Número, Código Postal, Cidade`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            address: { type: "string" }
          }
        }
      });
      return result.address || `Localização: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error("Erro no geocoding:", error);
      return `Localização: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } finally {
      setIsGettingAddress(false);
    }
  };

  const handleAddressSearch = async (addressQuery) => {
    if (!addressQuery || addressQuery.length < 5) return;

    setIsSearching(true);
    try {
      const result = await InvokeLLM({
        prompt: `Encontra as coordenadas geográficas para o endereço: "${addressQuery}" em Portugal.
        Responde com coordenadas precisas de latitude e longitude, e o endereço completo formatado.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            address: { type: "string" },
            found: { type: "boolean" }
          }
        }
      });

      if (result.found && result.latitude && result.longitude) {
        const newLat = result.latitude;
        const newLng = result.longitude;

        setFormData(prev => ({
          ...prev,
          address: result.address,
          latitude: newLat,
          longitude: newLng
        }));

        // Center the form map to the found location
        if (formMapRef.current) {
          formMapRef.current.setView([newLat, newLng], 12);
        }

        setIsAddingNew(true); // Assume search leads to adding new
        setIsEditing(false); // Make sure we are not in editing mode
      } else {
        alert("Morada não encontrada. Tente ser mais específico ou use o duplo clique no mapa.");
      }
    } catch (error) {
      console.error("Erro na pesquisa de endereço:", error);
      alert("Erro ao pesquisar morada. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };


  const handleMapDoubleClick = async (e) => {
    const { lat, lng } = e.latlng;

    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));

    const address = await getAddressFromCoordinates(lat, lng);
    setFormData(prev => ({
      ...prev,
      address,
      latitude: lat, // Re-set lat/lng just in case
      longitude: lng
    }));

    setIsAddingNew(true);
    setIsEditing(false); // Ensure we are in adding mode
  };

  const handleMarkerDragEnd = async (e) => {
    const { lat, lng } = e.target.getLatLng();
    // Update formData directly with new coordinates
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    // Get new address for the dragged location
    const address = await getAddressFromCoordinates(lat, lng);
    setFormData(prev => ({ ...prev, address: address }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure coordinates are present before submission
      if (!formData.latitude || !formData.longitude) {
        alert("Por favor, selecione uma localização no mapa ou pesquise um endereço válido.");
        return;
      }

      const warehouseData = {
        ...formData,
        owner_id: user.id,
        latitude: formData.latitude, // Explicitly include these
        longitude: formData.longitude, // Explicitly include these
        capacity_vehicles: formData.capacity_vehicles ? parseInt(formData.capacity_vehicles) : null
      };

      if (isEditing && selectedWarehouse) {
        await Warehouse.update(selectedWarehouse.id, warehouseData);
      } else {
        await Warehouse.create(warehouseData);
      }

      resetFormAndState();
      loadWarehouses();
    } catch (error) {
      console.error("Erro ao salvar armazém:", error);
      alert("Erro ao salvar armazém. Verifique os dados e tente novamente.");
    }
  };

  const resetFormAndState = () => {
    setFormData({
      name: '',
      address: '',
      operating_radius_km: 25,
      warehouse_type: 'secondary',
      capacity_vehicles: '',
      operating_hours_start: '08:00',
      operating_hours_end: '18:00',
      contact_person: '',
      contact_phone: '',
      latitude: null,
      longitude: null
    });
    setSelectedWarehouse(null);
    setIsEditing(false);
    setIsAddingNew(false);

    // Clear timeout if it exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setIsSearching(false); // Reset search state
  };

  const handleEdit = (warehouse) => {
    if (warehouse) {
      setSelectedWarehouse(warehouse);
      setFormData({
        name: warehouse.name || '',
        address: warehouse.address || '',
        operating_radius_km: warehouse.operating_radius_km || 25,
        warehouse_type: warehouse.warehouse_type || 'secondary',
        capacity_vehicles: warehouse.capacity_vehicles || '',
        operating_hours_start: warehouse.operating_hours_start || '08:00',
        operating_hours_end: warehouse.operating_hours_end || '18:00',
        contact_person: warehouse.contact_person || '',
        contact_phone: warehouse.contact_phone || '',
        latitude: warehouse.latitude, // Ensure latitude/longitude are preserved for existing
        longitude: warehouse.longitude
      });

      // Center the form map on the selected warehouse
      if (formMapRef.current && warehouse.latitude && warehouse.longitude) {
        formMapRef.current.setView([warehouse.latitude, warehouse.longitude], 12);
      }

      setIsEditing(true);
      setIsAddingNew(false); // Not adding a new one, but editing an existing
    } else { // Handle click on "Add Armazém" button
      setSelectedWarehouse(null);
      setFormData({ // Reset form for new entry
        name: '',
        address: '',
        operating_radius_km: 25,
        warehouse_type: 'secondary',
        capacity_vehicles: '',
        operating_hours_start: '08:00',
        operating_hours_end: '18:00',
        contact_person: '',
        contact_phone: '',
        latitude: null, // Ensure these are null for a new entry
        longitude: null
      });
      setIsEditing(false); // Not editing
      setIsAddingNew(true); // Adding new
      // When adding new, the form map should center itself, e.g., to the main map's current center
      if (formMapRef.current) {
        formMapRef.current.setView(mapCenter, 8); // Re-center form map to default/main map center
      }
    }
  };

  const handleDelete = async (warehouseId) => {
    if (confirm("Tem certeza que deseja eliminar este armazém?")) {
      try {
        await Warehouse.delete(warehouseId);
        loadWarehouses();
        if (selectedWarehouse?.id === warehouseId) {
          resetFormAndState();
        }
      } catch (error) {
        console.error("Erro ao eliminar armazém:", error);
        alert("Erro ao eliminar armazém.");
      }
    }
  };

  const warehouseTypeLabels = {
    main: "Principal",
    secondary: "Secundário",
    pickup_point: "Ponto de Retirada"
  };

  // Determine the initial center for the form map based on current formData lat/lng, or default map center
  const formMapInitialCenter = (formData.latitude && formData.longitude) ? [formData.latitude, formData.longitude] : mapCenter;


  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" />
            Mapa e Gestão de Armazéns
          </CardTitle>
          <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Armazém
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">Clique duas vezes no mapa para adicionar um novo armazém ou clique num existente para o editar.</p>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        {/* Coluna do Mapa Principal (Visualização de todos os armazéns) */}
        <div className="h-[600px] bg-gray-200 rounded-lg overflow-hidden border-2 border-blue-200 relative">
          <MapContainer
            key={mapKey} // To force re-render for new center
            center={mapCenter}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            doubleClickZoom={false} // Desativar zoom com duplo clique
            // No ref for this map, as programmatic control is not needed
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {/* MapEvents removed from main map as interactions for adding/editing are now on the form's map */}

            {/* Marcadores dos armazéns existentes */}
            {warehouses.map((warehouse) => (
              <React.Fragment key={warehouse.id}>
                <Marker
                  position={[warehouse.latitude, warehouse.longitude]}
                  icon={warehouseIcon}
                  eventHandlers={{
                    click: () => handleEdit(warehouse)
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">{warehouse.name}</h4>
                      <p className="text-sm text-gray-600">{warehouse.address}</p>
                      <p className="text-xs text-blue-600">
                        Raio: {warehouse.operating_radius_km}km
                      </p>
                      <Badge className="mt-1 text-xs">
                        {warehouseTypeLabels[warehouse.warehouse_type]}
                      </Badge>
                      <div className="mt-2 flex justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(warehouse)}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(warehouse.id)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[warehouse.latitude, warehouse.longitude]}
                  radius={(selectedWarehouse?.id === warehouse.id ? formData.operating_radius_km : warehouse.operating_radius_km) * 1000}
                  pathOptions={{
                    color: selectedWarehouse?.id === warehouse.id ? 'blue' : 'purple',
                    fillColor: selectedWarehouse?.id === warehouse.id ? 'blue' : 'purple',
                    fillOpacity: 0.1,
                    weight: 2
                  }}
                />
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
        {/* Coluna do Formulário (incluindo o mapa de edição/adição) */}
        <div className="flex flex-col">
          <AnimatePresence>
            {(isEditing || isAddingNew) ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-md h-full flex flex-col"
              >
                <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-semibold flex items-center justify-between">
                    {selectedWarehouse ? "Editar Armazém" : "Adicionar Novo Armazém"}
                    <Button type="button" variant="ghost" size="icon" onClick={resetFormAndState}>
                      <X className="w-4 h-4" />
                    </Button>
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="warehouse_name">Nome</Label>
                    <Input
                      id="warehouse_name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      placeholder="Ex: Armazém Lisboa Norte"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warehouse_address">Endereço</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="warehouse_address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault(); // Prevent form submission
                            handleAddressSearch(formData.address);
                          }
                        }}
                        placeholder="Pesquise o endereço ou duplo-clique no mapa"
                        required
                        disabled={isGettingAddress}
                      />
                      {isSearching || isGettingAddress ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      ) : (
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleAddressSearch(formData.address)} title="Pesquisar endereço">
                          <Search className="w-5 h-5 text-gray-500" />
                        </Button>
                      )}
                    </div>
                    {(isGettingAddress || isSearching) && <p className="text-xs text-blue-600">{isSearching ? "A pesquisar no mapa..." : "A obter morada..."}</p>}
                    {formData.latitude && formData.longitude && (
                      <p className="text-xs text-gray-500">
                        Coordenadas: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>

                  {/* MAPA DENTRO DO FORMULÁRIO */}
                  <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden border-2 border-purple-300">
                    <MapContainer
                      // Center the form map based on the current formData lat/lng, or default to mapCenter
                      center={formMapInitialCenter}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                      whenCreated={map => formMapRef.current = map} // Assign ref to this map
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      <MapEvents onDoubleClick={handleMapDoubleClick} />

                      {/* Marcador para novo armazém ou para edição */}
                      {(isAddingNew || isEditing) && formData.latitude && formData.longitude && (
                        <Marker
                          position={[
                            formData.latitude,
                            formData.longitude
                          ]}
                          icon={newLocationIcon} // Use newLocationIcon for the editable marker
                          draggable={true}
                          eventHandlers={{
                            dragend: handleMarkerDragEnd,
                          }}
                        >
                          <Popup>Arraste para ajustar a posição</Popup>
                        </Marker>
                      )}

                      {/* Círculo de raio */}
                      {(isAddingNew || isEditing) && formData.latitude && formData.longitude && (
                        <Circle
                          center={[formData.latitude, formData.longitude]}
                          radius={formData.operating_radius_km * 1000}
                          pathOptions={{
                            color: 'blue', // Changed to blue to distinguish from existing warehouses on main map
                            fillColor: 'blue',
                            fillOpacity: 0.1
                          }}
                        />
                      )}
                    </MapContainer>
                  </div>
                  {/* FIM DO MAPA DENTRO DO FORMULÁRIO */}

                  <div className="space-y-2">
                    <Label htmlFor="warehouse_type">Tipo</Label>
                    <Select
                      value={formData.warehouse_type}
                      onValueChange={(value) => setFormData(prev => ({...prev, warehouse_type: value}))}
                    >
                      <SelectTrigger id="warehouse_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(warehouseTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Controlo do Raio */}
                  <div className="space-y-3">
                    <Label>Raio de Operação: {formData.operating_radius_km} km</Label>
                    <Input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={formData.operating_radius_km}
                      onChange={(e) => setFormData(prev => ({...prev, operating_radius_km: parseInt(e.target.value)}))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>5km</span>
                      <span className="font-medium text-blue-600">{formData.operating_radius_km}km</span>
                      <span>100km</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Capacidade (Veículos)</Label>
                      <Input
                        type="number"
                        value={formData.capacity_vehicles}
                        onChange={(e) => setFormData(prev => ({...prev, capacity_vehicles: e.target.value}))}
                        placeholder="Ex: 10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pessoa de Contacto</Label>
                      <Input
                        value={formData.contact_person}
                        onChange={(e) => setFormData(prev => ({...prev, contact_person: e.target.value}))}
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Horário de Abertura</Label>
                      <Input
                        type="time"
                        value={formData.operating_hours_start}
                        onChange={(e) => setFormData(prev => ({...prev, operating_hours_start: e.target.value}))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário de Fecho</Label>
                      <Input
                        type="time"
                        value={formData.operating_hours_end}
                        onChange={(e) => setFormData(prev => ({...prev, operating_hours_end: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-auto pt-4 border-t border-gray-100">
                    <Button type="button" variant="outline" onClick={resetFormAndState}>
                      Cancelar
                    </Button>
                    {selectedWarehouse && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleDelete(selectedWarehouse.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                      </Button>
                    )}
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSearching || isGettingAddress || (!formData.latitude || !formData.longitude)}>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Atualizar' : 'Criar'} Armazém
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-center p-6 bg-gray-50 rounded-lg border">
                <div>
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">Selecione um armazém para editar</h3>
                  <p className="text-gray-500 mt-1">Ou clique duas vezes no mapa para adicionar um novo.</p>
                  <p className="text-gray-500 mt-1">Clique no botão <span className="font-semibold text-blue-600">"+ Adicionar Armazém"</span> acima para começar.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
