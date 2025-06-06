"use client"

import { useState } from "react"
import { ArrowLeft, Save, X, History, User, Settings, CreditCard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useParams } from "next/navigation"

// Dados simulados do cliente
const clientData = {
  id: 1,
  cliente: "Smith Corporation",
  contrato: "198200098",
  plano: "Ouro",
  viso: "130/1800",
  status: "Ativo",
  email: "contato@smith.com",
  telefone: "(11) 99999-9999",
  endereco: "Rua das Flores, 123",
  cidade: "São Paulo",
  cep: "01234-567",
  responsavel: "João Silva",
  dataContrato: "2023-01-15",
  dataVencimento: "2024-01-15",
  observacoes: "Cliente premium com suporte prioritário",
  configuracoes: {
    notificacoes: true,
    relatorios: true,
    apiAccess: false,
    backupAutomatico: true,
  },
}

const planHistory = [
  {
    id: 1,
    planoAnterior: "Prata",
    planoNovo: "Ouro",
    data: "2024-01-15",
    usuario: "Admin",
    motivo: "Upgrade solicitado pelo cliente",
  },
  {
    id: 2,
    planoAnterior: "Bronze",
    planoNovo: "Prata",
    data: "2023-12-10",
    usuario: "Sistema",
    motivo: "Migração automática por uso",
  },
]

export default function EditClient() {
  const params = useParams()
  const [formData, setFormData] = useState(clientData)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleConfigChange = (field: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      configuracoes: {
        ...prev.configuracoes,
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Dados salvos:", formData)
    setIsLoading(false)
    // Aqui você redirecionaria ou mostraria uma mensagem de sucesso
  }

  const getPlanBadge = (plano: string) => {
    const colors = {
      Ouro: "bg-yellow-100 text-yellow-800",
      Prata: "bg-gray-100 text-gray-800",
      Diamante: "bg-blue-100 text-blue-800",
      Bronze: "bg-orange-100 text-orange-800",
    }
    return <Badge className={colors[plano as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{plano}</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
              <p className="text-sm text-gray-500">
                {formData.cliente} • Contrato: {formData.contrato}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Geral</span>
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Plano</span>
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Geral */}
          <TabsContent value="geral" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente">Nome do Cliente</Label>
                    <Input
                      id="cliente"
                      value={formData.cliente}
                      onChange={(e) => handleInputChange("cliente", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contrato">Número do Contrato</Label>
                    <Input
                      id="contrato"
                      value={formData.contrato}
                      onChange={(e) => handleInputChange("contrato", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Input
                      id="responsavel"
                      value={formData.responsavel}
                      onChange={(e) => handleInputChange("responsavel", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange("endereco", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange("cidade", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input id="cep" value={formData.cep} onChange={(e) => handleInputChange("cep", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  placeholder="Observações sobre o cliente..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Plano */}
          <TabsContent value="plano" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Plano</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plano">Plano Atual</Label>
                    <Select
                      value={formData.plano.toLowerCase()}
                      onValueChange={(value) => handleInputChange("plano", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze</SelectItem>
                        <SelectItem value="prata">Prata</SelectItem>
                        <SelectItem value="ouro">Ouro</SelectItem>
                        <SelectItem value="diamante">Diamante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limite">Limite de Uso</Label>
                    <Input
                      id="limite"
                      type="number"
                      value={formData.viso.split("/")[1]}
                      onChange={(e) => {
                        const currentUsage = formData.viso.split("/")[0]
                        handleInputChange("viso", `${currentUsage}/${e.target.value}`)
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataContrato">Data do Contrato</Label>
                      <Input
                        id="dataContrato"
                        type="date"
                        value={formData.dataContrato}
                        onChange={(e) => handleInputChange("dataContrato", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                      <Input
                        id="dataVencimento"
                        type="date"
                        value={formData.dataVencimento}
                        onChange={(e) => handleInputChange("dataVencimento", e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uso Atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{formData.viso.split("/")[0]}</div>
                    <div className="text-sm text-gray-500 mb-4">de {formData.viso.split("/")[1]} utilizados</div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((Number.parseInt(formData.viso.split("/")[0]) / Number.parseInt(formData.viso.split("/")[1])) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {Math.round(
                        (Number.parseInt(formData.viso.split("/")[0]) / Number.parseInt(formData.viso.split("/")[1])) *
                          100,
                      )}
                      % utilizado
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Plano:</span>
                      <span>{getPlanBadge(formData.plano)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={formData.status === "Ativo" ? "default" : "secondary"}>{formData.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Configurações */}
          <TabsContent value="configuracoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Configurações Avançadas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por E-mail</Label>
                    <p className="text-sm text-gray-500">Receber notificações sobre uso e limites</p>
                  </div>
                  <Switch
                    checked={formData.configuracoes.notificacoes}
                    onCheckedChange={(checked) => handleConfigChange("notificacoes", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatórios Automáticos</Label>
                    <p className="text-sm text-gray-500">Gerar relatórios mensais automaticamente</p>
                  </div>
                  <Switch
                    checked={formData.configuracoes.relatorios}
                    onCheckedChange={(checked) => handleConfigChange("relatorios", checked)}
                  />
                </div>
   
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Histórico */}
          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Alterações do Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">{new Date(item.data).toLocaleDateString("pt-BR")}</div>
                        <div className="flex items-center space-x-2">
                          {getPlanBadge(item.planoAnterior)}
                          <span className="text-gray-400">→</span>
                          {getPlanBadge(item.planoNovo)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.usuario}</div>
                        <div className="text-xs text-gray-500">{item.motivo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
