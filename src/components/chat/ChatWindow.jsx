
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/api/entities";
import { User } from "@/api/entities";
import { 
  Send, 
  Image, 
  MapPin, 
  MessageCircle,
  X,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile } from "@/api/integrations";

export default function ChatWindow({ delivery, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const chatMessages = await ChatMessage.filter({ 
        delivery_id: delivery.id 
      }, "created_date", 100);
      setMessages(chatMessages);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  }, [delivery.id]);

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      await loadMessages();
    } catch (error) {
      console.error("Erro ao carregar dados do chat:", error);
    }
  }, [loadMessages]);

  useEffect(() => {
    loadData();
    // Aumentar o intervalo de polling do chat para reduzir a carga na API
    const interval = setInterval(loadMessages, 30000); // De 15 para 30 segundos
    return () => clearInterval(interval);
  }, [loadData, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageData) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await ChatMessage.create({
        delivery_id: delivery.id,
        sender_type: "driver",
        sender_id: user.id,
        sender_name: user.full_name,
        ...messageData
      });
      
      await loadMessages();
      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!newMessage.trim()) return;
    await sendMessage({ message: newMessage });
  };

  const handleSendImage = async (file) => {
    try {
      const { file_url } = await UploadFile({ file });
      await sendMessage({
        message: "Imagem enviada",
        message_type: "image",
        image_url: file_url
      });
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
    }
  };

  const handleSendLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await sendMessage({
          message: "Localização atual",
          message_type: "location",
          latitude,
          longitude
        });
      });
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="shadow-xl border-0 h-96 flex flex-col">
        <CardHeader className="pb-3 bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat com Cliente - {delivery.customer_name}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-blue-700">
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === "driver" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender_type === "driver"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    <div className="text-xs opacity-75 mb-1">
                      {message.sender_name}
                    </div>
                    
                    {message.message_type === "text" && (
                      <p className="text-sm">{message.message}</p>
                    )}
                    
                    {message.message_type === "image" && (
                      <div>
                        <img 
                          src={message.image_url} 
                          alt="Imagem enviada"
                          className="w-full h-32 object-cover rounded mb-1"
                        />
                        <p className="text-xs">{message.message}</p>
                      </div>
                    )}
                    
                    {message.message_type === "location" && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs">Localização</span>
                        </div>
                        <a
                          href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                        >
                          Ver no mapa
                        </a>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-75 mt-1">
                      {formatTime(message.created_date)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input de mensagem */}
          <div className="p-3 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                disabled={isLoading}
              />
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleSendImage(e.target.files[0])}
                className="hidden"
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current.click()}
                disabled={isLoading}
              >
                <Camera className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleSendLocation}
                disabled={isLoading}
              >
                <MapPin className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleSendText}
                disabled={isLoading || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
