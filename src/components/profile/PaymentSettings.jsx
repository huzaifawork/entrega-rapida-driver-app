import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Bitcoin, Ticket, Fuel } from "lucide-react";

const VoucherCard = ({ icon, title, description, company, onSelect }) => {
  const Icon = icon;
  return (
    <div className="border rounded-lg p-4 flex flex-col items-center text-center hover:bg-gray-50 transition-colors">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-500 mb-3">{description}</p>
      <p className="text-xs text-gray-400 mb-4">Parceiro: {company}</p>
      <Button onClick={onSelect} size="sm">Selecionar</Button>
    </div>
  );
};

export default function PaymentSettings({ user, editedData, setEditedData }) {
  const paymentMethod = editedData?.payment_method || "bank_transfer";
  const paymentPreference = editedData?.payment_preference || "payout";

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({...prev, [field]: value}));
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Preferências de Recebimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 rounded-lg bg-gray-100 p-1 mb-6">
            <Button
              onClick={() => handleFieldChange('payment_preference', 'payout')}
              className={`flex-1 ${paymentPreference === 'payout' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}
              variant="ghost"
            >
              Receber Pagamento
            </Button>
            <Button
              onClick={() => handleFieldChange('payment_preference', 'vouchers')}
              className={`flex-1 ${paymentPreference === 'vouchers' ? 'bg-white text-blue-600 shadow-sm' : 'bg-transparent text-gray-600'}`}
              variant="ghost"
            >
              Converter em Vouchers
            </Button>
          </div>

          {paymentPreference === 'payout' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Escolha o Método de Pagamento</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => handleFieldChange('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Transferência Bancária (IBAN)
                      </div>
                    </SelectItem>
                    <SelectItem value="mbway">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        MBWay
                      </div>
                    </SelectItem>
                    <SelectItem value="bitcoin">
                      <div className="flex items-center gap-2">
                        <Bitcoin className="w-4 h-4" />
                        Bitcoin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "bank_transfer" && (
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      placeholder="PT50 0000 0000 0000 0000 0000 0"
                      value={editedData.iban || ""}
                      onChange={(e) => handleFieldChange('iban', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "mbway" && (
                <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="mbway_phone">Número de Telefone MBWay</Label>
                    <Input
                      id="mbway_phone"
                      placeholder="ex: +351 912 345 678"
                      value={editedData.mbway_phone || ""}
                      onChange={(e) => handleFieldChange('mbway_phone', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "bitcoin" && (
                <div className="space-y-4 bg-orange-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="bitcoin_address">Endereço Bitcoin</Label>
                    <Input
                      id="bitcoin_address"
                      placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                      value={editedData.bitcoin_address || ""}
                      onChange={(e) => handleFieldChange('bitcoin_address', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentPreference === 'vouchers' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg">Troque seus ganhos por Vouchers</h3>
                <p className="text-sm text-gray-600">Aproveite benefícios e descontos exclusivos com os nossos parceiros.</p>
                <div className="bg-green-50 p-3 rounded-lg mt-4">
                  <p className="text-sm text-green-700">
                    💰 <strong>Vantagem Fiscal:</strong> Vouchers não são tributados como rendimento!
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <VoucherCard 
                  icon={Fuel}
                  title="Voucher Combustível"
                  description="Desconto de 5-10% em postos de combustível aderentes."
                  company="Galp, BP, Repsol"
                  onSelect={() => alert("Funcionalidade de Vouchers em desenvolvimento.")}
                />
                <VoucherCard 
                  icon={Ticket}
                  title="Cartão Oferta"
                  description="Use em centenas de lojas de retalho e supermercados."
                  company="Cartão Dá, Sonae"
                  onSelect={() => alert("Funcionalidade de Vouchers em desenvolvimento.")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Informação Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minimum_payout">Valor Mínimo para Levantamento (€)</Label>
            <Input
              id="minimum_payout"
              type="number"
              placeholder="100"
              value={editedData.minimum_payout || "100"}
              onChange={(e) => handleFieldChange('minimum_payout', parseFloat(e.target.value))}
            />
            <p className="text-sm text-gray-500">
              Apenas aplicável para pagamentos em dinheiro. Pagamentos são processados semanalmente.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Saldo Atual</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Pendente</p>
                <p className="text-xl font-bold text-orange-600">€{user?.pending_balance?.toFixed(2) || "0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ganho</p>
                <p className="text-xl font-bold text-green-600">€{user?.total_earned?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}