
import React, { useState, useEffect, useCallback, useRef } from "react";
import { throttle } from "lodash";
import { Delivery } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { Warehouse } from "@/api/entities";
import { User } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bell,
  Package,
  Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import StatsOverview from "../components/dashboard/StatsOverview";
import DeliveryCard from "../components/dashboard/DeliveryCard";
import ActiveDelivery from "../components/dashboard/ActiveDelivery";
import NotificationPanel from "../components/dashboard/NotificationPanel";

// Corrigir problema do ícone do marcador padrão do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem',
  overflow: 'hidden',
};

const defaultCenter = [38.7223, -9.1393];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  const mapRef = useRef(null);

  const activeDeliveryRef = useRef(activeDelivery);
  useEffect(() => {
    activeDeliveryRef.current = activeDelivery;
  }, [activeDelivery]);

  const loadData = useCallback(async () => {
    try {
      setAuthError(false);
      // Funções auxiliares movidas para dentro do callback
      const deg2rad = (deg) => {
        return deg * (Math.PI/180);
      };

      const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Raio da Terra em km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1); 
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c; // Distância em km
        return d;
      };

      const isDeliveryInRange = (delivery, warehouses, userLocation) => {
        if (!delivery.delivery_lat || !delivery.delivery_lng) return true;
        
        // Verificar se a entrega está dentro do raio de qualquer armazém ativo
        const activeWarehouses = warehouses.filter(wh => wh.is_active);
        const isInWarehouseRange = activeWarehouses.some(warehouse => {
          const distance = getDistanceFromLatLonInKm(
            delivery.delivery_lat,
            delivery.delivery_lng,
            warehouse.latitude,
            warehouse.longitude
          );
          
          return distance <= warehouse.operating_radius_km;
        });

        // Se não há armazéns ativos ou entrega não está no seu raio,
        // usar a localização base do usuário se disponível e dentro do seu raio.
        if (!isInWarehouseRange && userLocation && userLocation.base_location_lat && userLocation.base_location_lng) {
          const distance = getDistanceFromLatLonInKm(
            delivery.delivery_lat,
            delivery.delivery_lng,
            userLocation.base_location_lat,
            userLocation.base_location_lng
          );
          // Usar o operating_radius_km do usuário se definido, caso contrário um padrão (ex: 50km)
          return distance <= (userLocation.operating_radius_km || 50);
        }

        return isInWarehouseRange;
      };

      const userData = await User.me();
      setUser(userData);

      const userVehicles = await Vehicle.filter({ owner_id: userData.id }, "-created_date");
      setVehicles(userVehicles);

      const userWarehouses = await Warehouse.filter({ owner_id: userData.id }, "-created_date");
      setWarehouses(userWarehouses);

      const available = await Delivery.filter({ status: "available" }, "-created_date", 20);

      // Filtrar entregas por compatibilidade de veículos E raio de operação
      const compatibleDeliveries = available.filter(delivery => {
        // Verificar compatibilidade de veículos
        const hasCompatibleVehicle = userVehicles.some(vehicle => {
          if (!vehicle.is_active) return false;
          const vehicleMatches = !delivery.required_vehicle_type ||
                               delivery.required_vehicle_type === vehicle.vehicle_type;
          const craneMatches = !delivery.requires_crane || vehicle.has_crane;
          const weightMatches = !delivery.total_weight_kg ||
                              vehicle.max_weight_kg >= delivery.total_weight_kg;

          return vehicleMatches && craneMatches && weightMatches;
        });

        // Verificar se está dentro do raio de operação
        const isInRange = isDeliveryInRange(delivery, userWarehouses, userData);
        
        return hasCompatibleVehicle && isInRange;
      });

      setAvailableDeliveries(compatibleDeliveries);

      const active = await Delivery.filter({
        driver_id: userData.id,
        status: ["accepted", "heading_pickup", "arrived_pickup", "picked_up", "heading_delivery", "arrived_delivery"]
      }, "-created_date", 1);
      setActiveDelivery(active[0] || null);
      
      // Calculate real-time stats
      const allDriverDeliveries = await Delivery.filter({ driver_id: userData.id }, "-created_date");
      const completedDeliveries = allDriverDeliveries.filter(d => d.status === "delivered");
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const todayEarnings = completedDeliveries
        .filter(d => {
          const date = d.delivery_time?.toDate ? d.delivery_time.toDate() : 
                      d.created_date?.toDate ? d.created_date.toDate() : 
                      new Date(d.delivery_time || d.created_date);
          return date >= today;
        })
        .reduce((sum, d) => sum + (d.delivery_fee || 7.50), 0);
      
      const weekEarnings = completedDeliveries
        .filter(d => {
          const date = d.delivery_time?.toDate ? d.delivery_time.toDate() : 
                      d.created_date?.toDate ? d.created_date.toDate() : 
                      new Date(d.delivery_time || d.created_date);
          return date >= weekAgo;
        })
        .reduce((sum, d) => sum + (d.delivery_fee || 7.50), 0);
      
      setUser(prev => ({
        ...prev,
        earnings_today: todayEarnings,
        earnings_week: weekEarnings,
        total_deliveries: completedDeliveries.length,
        rating: prev?.rating || 5.0
      }));

      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      if (error.message === 'Not authenticated') {
        setAuthError(true);
      }
      setIsLoading(false);
    }
  }, []);

  const throttledUpdateLocationRef = useRef();
  useEffect(() => {
    throttledUpdateLocationRef.current = throttle(async (lat, lng) => {
      try {
        await User.updateMyUserData({ current_lat: lat, current_lng: lng });
        
        const currentActiveDelivery = activeDeliveryRef.current;
        if (currentActiveDelivery) {
          await Delivery.update(currentActiveDelivery.id, {
            driver_location_lat: lat,
            driver_location_lng: lng,
          });
          
          setActiveDelivery(prev => prev ? {...prev, driver_location_lat: lat, driver_location_lng: lng} : null);
        }
        
        setUser(prev => prev ? {...prev, current_lat: lat, current_lng: lng} : null);

      } catch (error) {
        console.error("Erro ao atualizar localização:", error);
      }
    }, 30000, { trailing: false }); // Aumentar para 30 segundos
  }, []);

  useEffect(() => {
    loadData();
    
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (throttledUpdateLocationRef.current) {
            throttledUpdateLocationRef.current(latitude, longitude);
          }
        },
        (error) => console.error("Erro ao obter localização:", error),
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 30000 }
      );
    }
    
    // Reduzir ainda mais a frequência de polling
    const interval = setInterval(loadData, 120000); // 2 minutos
    
    return () => {
      clearInterval(interval);
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = Delivery.onSnapshot(null, () => {
      loadData();
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadData]);

  const acceptDelivery = async (delivery) => {
    try {
      const compatibleVehicle = vehicles.find(vehicle => {
          if (!vehicle.is_active) return false;
          const vehicleMatches = !delivery.required_vehicle_type || delivery.required_vehicle_type === vehicle.vehicle_type;
          const craneMatches = !delivery.requires_crane || vehicle.has_crane;
          const weightMatches = !delivery.total_weight_kg || vehicle.max_weight_kg >= delivery.total_weight_kg;
          return vehicleMatches && craneMatches && weightMatches;
      });

      if (!compatibleVehicle) {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: "error",
          message: "Nenhum veículo compatível ativo foi encontrado.",
          time: new Date()
        }]);
        return;
      }

      await Delivery.update(delivery.id, {
        status: "accepted",
        driver_id: user.id,
        vehicle_id: compatibleVehicle.id
      });

      // Sync status back to order
      const { syncDeliveryToOrder } = await import('@/shared/firebase-entities.js');
      await syncDeliveryToOrder(delivery.id, 'accepted');

      setActiveDelivery({ ...delivery, status: "accepted", driver_id: user.id, vehicle_id: compatibleVehicle.id });
      setAvailableDeliveries(prev => prev.filter(d => d.id !== delivery.id));

      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: "success",
        message: `Entrega ${delivery.order_id} aceita! Dirija-se ao local de retirada.`,
        time: new Date()
      }]);
    } catch (error) {
      console.error("Erro ao aceitar entrega:", error);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: "error",
        message: "Erro ao aceitar entrega. Tente novamente.",
        time: new Date()
      }]);
    }
  };

  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      const updateData = {
        status: newStatus,
        ...(newStatus === "picked_up" && { pickup_time: new Date().toISOString() }),
        ...(newStatus === "delivered" && { delivery_time: new Date().toISOString() })
      };

      await Delivery.update(deliveryId, updateData);

      // Sync status back to order
      const { syncDeliveryToOrder } = await import('@/shared/firebase-entities.js');
      await syncDeliveryToOrder(deliveryId, newStatus);

      if (newStatus === "delivered") {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: "success",
          message: "Entrega concluída! Aguarde confirmação do cliente.",
          time: new Date()
        }]);
        setActiveDelivery(null);
      } else {
        setActiveDelivery(prev => (prev ? { ...prev, status: newStatus, ...updateData } : null));
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const currentMapCenter = (user?.current_lat && user?.current_lng) 
    ? [user.current_lat, user.current_lng] 
    : defaultCenter;

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4">App de Entregas</h2>
          <p className="text-gray-600 mb-6">
            Esta é a aplicação para transportadores.<br/>
            Por favor, faça login com uma conta de transportador.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6 text-sm text-left">
            <p className="font-semibold mb-2">💡 Como testar:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Abra o marketplace em outra aba</li>
              <li>Faça login lá primeiro</li>
              <li>Volte aqui e atualize a página</li>
            </ol>
          </div>
          <a href="/Login" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Fazer Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 lg:pb-4 bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {user?.full_name?.split(' ')[0] || "Transportador"}! 👋
              </h1>
              <p className="text-gray-600 mt-1">
                {user?.is_available ? "Você está online e disponível" : "Você está offline"}
              </p>
              {user?.company_name && (
                <p className="text-sm text-blue-600 font-medium">{user.company_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-400" />
              {notifications.length > 0 && (
                <Badge variant="destructive" className="w-5 h-5 rounded-full p-0 flex items-center justify-center">
                  {notifications.length}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <StatsOverview user={user} isLoading={isLoading} />

        {activeDelivery && (
          <>
            <ActiveDelivery
              delivery={activeDelivery}
              onStatusUpdate={updateDeliveryStatus}
              selectedVehicle={vehicles.find(v => v.id === activeDelivery.vehicle_id)}
            />

            <Card className="shadow-lg border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Navigation className="w-6 h-6 text-blue-600" />
                  Mapa da Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={containerStyle}>
                  <MapContainer 
                    center={currentMapCenter} 
                    zoom={13} 
                    ref={mapRef} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {user?.current_lat && user?.current_lng && (
                      <Marker position={[user.current_lat, user.current_lng]} icon={driverIcon}>
                        <Popup>A sua posição</Popup>
                      </Marker>
                    )}

                    {activeDelivery.pickup_lat && activeDelivery.pickup_lng && (
                       <Marker position={[activeDelivery.pickup_lat, activeDelivery.pickup_lng]} icon={pickupIcon}>
                        <Popup>Local de Retirada: <br/> {activeDelivery.pickup_address}</Popup>
                      </Marker>
                    )}

                    {activeDelivery.delivery_lat && activeDelivery.delivery_lng && (
                       <Marker position={[activeDelivery.delivery_lat, activeDelivery.delivery_lng]} icon={deliveryIcon}>
                        <Popup>Local de Entrega: <br/> {activeDelivery.delivery_address}</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="w-6 h-6 text-blue-600" />
              Entregas Disponíveis
              <Badge variant="secondary" className="ml-2">
                {availableDeliveries.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {availableDeliveries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhuma entrega disponível
                  </h3>
                  <p className="text-gray-500">
                    Novas entregas aparecerão aqui automaticamente.
                  </p>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {availableDeliveries.map((delivery) => (
                    <DeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      onAccept={() => acceptDelivery(delivery)}
                      isUserAvailable={user?.is_available}
                      userVehicles={vehicles}
                    />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <NotificationPanel notifications={notifications} />
      </div>
    </div>
  );
}
