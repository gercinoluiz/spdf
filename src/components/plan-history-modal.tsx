"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CalendarDays, History } from "lucide-react"

interface PlanHistoryModalProps {
  clientName: string
  clientId: number
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
  {
    id: 3,
    planoAnterior: "Bronze",
    planoNovo: "Bronze",
    data: "2023-11-01",
    usuario: "Admin",
    motivo: "Criação inicial do cliente",
  },
]

export function PlanHistoryModal({ clientName, clientId }: PlanHistoryModalProps) {
  const [open, setOpen] = useState(false)

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Histórico do Plano">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Histórico do Plano</span>
          </DialogTitle>
          <DialogDescription>Histórico de alterações do plano para {clientName}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{new Date(item.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{getPlanBadge(item.planoAnterior)}</TableCell>
                  <TableCell>{getPlanBadge(item.planoNovo)}</TableCell>
                  <TableCell className="text-sm">{item.usuario}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate" title={item.motivo}>
                    {item.motivo}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
