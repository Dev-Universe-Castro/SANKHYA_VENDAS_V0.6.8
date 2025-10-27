"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { EstoqueModal } from "@/components/estoque-modal"
import { toast } from "@/components/ui/use-toast" // Assuming toast is imported from here

interface ProdutoSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (produto: any, preco: number, quantidade: number) => void
  titulo?: string
}

export function ProdutoSelectorModal({
  isOpen,
  onClose,
  onConfirm,
  titulo = "Adicionar Produto"
}: ProdutoSelectorModalProps) {
  const [produtos, setProdutos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showEstoqueModal, setShowEstoqueModal] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null)
  const [produtoEstoque, setProdutoEstoque] = useState<number>(0)
  const [produtoPreco, setProdutoPreco] = useState<number>(0)

  const buscarProdutos = async (termo: string) => {
    if (termo.length < 2) {
      setProdutos([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/sankhya/produtos/search?q=${encodeURIComponent(termo)}&limit=20`)

      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`)
      }

      const data = await response.json()
      setProdutos(data.produtos || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      setProdutos([])
    } finally {
      setIsLoading(false)
    }
  }

  const buscarProdutosComDebounce = (() => {
    let timer: NodeJS.Timeout
    return (termo: string) => {
      clearTimeout(timer)
      timer = setTimeout(() => buscarProdutos(termo), 500)
    }
  })()

  const handleSelecionarProduto = async (produto: any) => {
    console.log('🔍 Selecionando produto:', produto.CODPROD)
    setProdutoSelecionado(produto)
    setIsLoading(true)

    // Carregar estoque e preço antes de abrir o modal
    try {
      console.log('📊 Buscando estoque e preço...')
      const [estoqueResponse, precoResponse] = await Promise.all([
        fetch(`/api/sankhya/produtos/estoque?codProd=${produto.CODPROD}`),
        fetch(`/api/sankhya/produtos/preco?codProd=${produto.CODPROD}`)
      ])

      console.log('📥 Respostas recebidas:', {
        estoqueOk: estoqueResponse.ok,
        precoOk: precoResponse.ok
      })

      if (!estoqueResponse.ok || !precoResponse.ok) {
        console.error('❌ Erro nas respostas:', {
          estoqueStatus: estoqueResponse.status,
          precoStatus: precoResponse.status
        })
        throw new Error('Erro ao buscar dados do produto')
      }

      const estoqueData = await estoqueResponse.json()
      const precoData = await precoResponse.json()

      console.log('📦 Dados recebidos:', { estoqueData, precoData })

      const estoqueTotal = (estoqueData.estoques || []).reduce((sum: number, est: any) => {
        const estoque = parseFloat(est.ESTOQUE || '0')
        console.log(`  Estoque local ${est.CODLOCAL}: ${estoque}`)
        return sum + estoque
      }, 0)

      console.log('💰 Estoque total calculado:', estoqueTotal)
      console.log('💵 Preço encontrado:', precoData.preco)

      setProdutoEstoque(estoqueTotal)
      setProdutoPreco(precoData.preco || 0)

      // Só abre o modal depois que os dados foram carregados
      setShowEstoqueModal(true)
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do produto:', error)
      alert(`Erro ao carregar informações do produto: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmarEstoque = (produto: any, preco: number, quantidade: number) => {
    setShowEstoqueModal(false)
    setProdutoSelecionado(null)
    setProdutoEstoque(0)
    setProdutoPreco(0)
    onConfirm(produto, preco, quantidade)
    setProdutos([])
    onClose()
  }

  const handleCancelarEstoque = () => {
    setShowEstoqueModal(false)
    setProdutoSelecionado(null)
    setProdutoEstoque(0)
    setProdutoPreco(0)
  }

  useEffect(() => {
    if (!isOpen) {
      setProdutos([])
      setProdutoSelecionado(null)
      setProdutoEstoque(0)
      setProdutoPreco(0)
    }
  }, [isOpen])

  return (
    <>
      <Dialog open={isOpen && !showEstoqueModal} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]" data-produto-selector style={{ zIndex: 50 }}>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Digite pelo menos 2 caracteres para buscar..."
              onChange={(e) => buscarProdutosComDebounce(e.target.value)}
              className="text-sm"
              autoFocus
            />
            <div className="max-h-96 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Buscando produtos...</span>
                </div>
              ) : produtos.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Digite pelo menos 2 caracteres para buscar produtos
                </div>
              ) : (
                produtos.map((produto) => (
                  <Card
                    key={produto.CODPROD}
                    className="cursor-pointer hover:bg-green-50 transition-colors"
                    onClick={() => handleSelecionarProduto(produto)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{produto.CODPROD} - {produto.DESCRPROD}</p>
                          {produto.MARCA && (
                            <p className="text-xs text-muted-foreground mt-1">Marca: {produto.MARCA}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEstoqueModal && (
        <EstoqueModal
          isOpen={showEstoqueModal}
          onClose={handleCancelarEstoque}
          product={produtoSelecionado}
          onConfirm={handleConfirmarEstoque}
          estoqueTotal={produtoEstoque}
          preco={produtoPreco}
        />
      )}
    </>
  )
}