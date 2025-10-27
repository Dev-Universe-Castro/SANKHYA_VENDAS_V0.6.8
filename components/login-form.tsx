
"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"

export default function LoginForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      if (data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user))
        setShowLoadingAnimation(true)
        
        // Aguardar 0.6 segundos mostrando a animação antes de redirecionar
        setTimeout(() => {
          router.push("/dashboard")
        }, 600)
      }
    } catch (err: any) {
      setError(err.message || "Email ou senha inválidos")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Overlay de animação de carregamento */}
      {showLoadingAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32">
              <Image
                src="/anigif.gif"
                alt="Carregando..."
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <p className="text-lg font-medium text-foreground">Liberdade para evoluir</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-card rounded-lg shadow-xl p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4">
          <Image
            src="/sankhya-logo-horizontal.png"
            alt="Sankhya Logo"
            width={240}
            height={80}
            className="object-contain"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-background border-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            Senha
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="bg-background border-input"
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium uppercase tracking-wide"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-primary hover:text-primary/90 font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
    </>
  )
}
