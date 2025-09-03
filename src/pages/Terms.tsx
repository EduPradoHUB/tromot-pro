import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>1. Aceitação dos Termos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ao acessar e utilizar o TROMOT Pro, você concorda em estar vinculado por estes Termos de Uso. 
                Se você não concordar com estes termos, não deve utilizar nossos serviços.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>2. Uso do Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>O TROMOT Pro é destinado exclusivamente para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Instaladores e técnicos automotivos profissionais</li>
                  <li>Acesso a manuais técnicos e documentação</li>
                  <li>Compartilhamento de experiências profissionais de instalação</li>
                  <li>Suporte técnico especializado</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>3. Conteúdo Compartilhado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>Ao compartilhar conteúdo no TROMOT Pro, você garante que:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Possui todos os direitos sobre o conteúdo compartilhado</li>
                  <li>O conteúdo é tecnicamente preciso e relevante</li>
                  <li>Não viola direitos autorais ou de propriedade intelectual</li>
                  <li>Não contém informações falsas ou enganosas</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>4. Moderação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A Tromot reserva-se o direito de moderar, editar ou remover qualquer conteúdo que 
                considere inadequado, impreciso ou que viole estes termos de uso.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>5. Responsabilidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                As informações fornecidas são para fins educacionais e informativos. Cada instalação 
                deve ser realizada por profissionais qualificados, seguindo as normas de segurança 
                e regulamentações locais.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>6. Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Estes termos podem ser alterados a qualquer momento. Alterações significativas 
                serão comunicadas aos usuários através do aplicativo.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>7. Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Para dúvidas sobre estes termos, entre em contato conosco através dos canais 
                oficiais da Tromot disponíveis em nosso site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}