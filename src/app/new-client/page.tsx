"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, X, User, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Header } from "@/components/header"

// Defina o esquema de validação com Zod
const formSchema = z.object({
  cliente: z.string().min(1, { message: "Nome do cliente é obrigatório" }),
  contrato: z.string().optional(),
  plano: z.string().default("bronze"),
  status: z.string().default("Ativo"),
  email: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  responsavel: z.string().optional(),
  dataContrato: z.string().optional(),
  dataVencimento: z.string().optional(),
  observacoes: z.string().optional(),
  limite: z.string().optional(),
})

// Tipo derivado do esquema
type FormValues = z.infer<typeof formSchema>

export default function NewClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Configurar React Hook Form com Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: "",
      contrato: "",
      plano: "bronze",
      status: "Ativo",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      cep: "",
      responsavel: "",
      dataContrato: new Date().toISOString().split('T')[0],
      dataVencimento: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      observacoes: "",
      limite: "1000",
    }
  })
  
  // Extrair métodos e estado do formulário
  const { register, handleSubmit, formState: { errors }, setValue, watch } = form
  
  // Função para enviar o formulário
  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    
    try {
      // Preparar dados para envio à API
      const clientData = {
        name: data.cliente,
        contractNumber: data.contrato,
        planId: data.plano,
        status: data.status,
        email: data.email,
        phone: data.telefone,
        address: data.endereco,
        city: data.cidade,
        zipCode: data.cep,
        responsible: data.responsavel,
        contractDate: data.dataContrato,
        expirationDate: data.dataVencimento,
        notes: data.observacoes,
        limit: parseInt(data.limite || "1000")
      }
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      console.log('Response:', response)
      
      if (!response.ok) {
        throw new Error('Erro ao criar cliente')
      }
      
      // Redirecionar para a lista de clientes
      router.push('/clients')
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      // Mostrar erro
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">


      {/* Header */}

      <Header/>
      <header className="bg-white border-b border-gray-200 px-6 py-4 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
              <p className="text-sm text-gray-500">
                Preencha os dados para criar um novo cliente
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/clients">
              <Button variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geral" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Geral</span>
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Plano</span>
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
                    <Label htmlFor="cliente">Nome do Cliente *</Label>
                    <Input
                      id="cliente"
                      {...register("cliente")}
                      className={errors.cliente ? "border-red-500" : ""}
                    />
                    {errors.cliente && (
                      <p className="text-sm text-red-500">{errors.cliente.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contrato">Número do Contrato</Label>
                    <Input
                      id="contrato"
                      {...register("contrato")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Input
                      id="responsavel"
                      {...register("responsavel")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      onValueChange={(value) => setValue("status", value)} 
                      defaultValue={watch("status")}
                    >
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
                      {...register("email")}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      {...register("telefone")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      {...register("endereco")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        {...register("cidade")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input 
                        id="cep" 
                        {...register("cep")} 
                      />
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
                  {...register("observacoes")}
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
                    <Label htmlFor="plano">Plano</Label>
                    <Select 
                      onValueChange={(value) => setValue("plano", value)} 
                      defaultValue={watch("plano")}
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
                      {...register("limite")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataContrato">Data do Contrato</Label>
                      <Input
                        id="dataContrato"
                        type="date"
                        {...register("dataContrato")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                      <Input
                        id="dataVencimento"
                        type="date"
                        {...register("dataVencimento")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
