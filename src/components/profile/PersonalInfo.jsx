import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Building } from "lucide-react";

export default function PersonalInfo({ editedData, setEditedData }) {
  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({...prev, [field]: value}));
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Informação Pessoal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={editedData.full_name || ""}
              onChange={(e) => handleFieldChange('full_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="+351 912 345 678"
              value={editedData.phone || ""}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Morada Completa</Label>
          <Input
            id="address"
            placeholder="Rua, número, código postal, cidade"
            value={editedData.address || ""}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nome da Empresa (opcional)</Label>
            <Input
              id="company_name"
              placeholder="Nome da sua empresa"
              value={editedData.company_name || ""}
              onChange={(e) => handleFieldChange('company_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_number">Número Fiscal</Label>
            <Input
              id="tax_number"
              placeholder="123456789"
              value={editedData.tax_number || ""}
              onChange={(e) => handleFieldChange('tax_number', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Informação de Contacto</h4>
              <p className="text-sm text-blue-800 mt-1">
                Esta informação é utilizada para comunicações importantes sobre as suas entregas e para fins de verificação da conta.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}