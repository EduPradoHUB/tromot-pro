import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Privacy() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>1. Informações Coletadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>Coletamos as seguintes informações quando você utiliza o TROMOT Pro:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Informações de cadastro (nome, e-mail, função profissional)</li>
                  <li>Conteúdo compartilhado (fotos de instalações, comentários, avaliações)</li>
                  <li>Dados de uso da aplicação (páginas visitadas, tempo de uso)</li>
                  <li>Informações técnicas (tipo de dispositivo, navegador, IP)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>2. Como Utilizamos suas Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer e melhorar nossos serviços</li>
                  <li>Personalizar sua experiência no aplicativo</li>
                  <li>Facilitar o compartilhamento de conhecimento entre profissionais</li>
                  <li>Gerar estatísticas de uso (de forma anonimizada)</li>
                  <li>Comunicações importantes sobre o serviço</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>3. Compartilhamento de Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>Não vendemos suas informações pessoais. Podemos compartilhar informações apenas:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Com sua autorização explícita</li>
                  <li>Para cumprimento de obrigações legais</li>
                  <li>Com prestadores de serviços que nos auxiliam na operação do aplicativo</li>
                  <li>Em caso de fusão, aquisição ou venda da empresa</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>4. Armazenamento e Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Seus dados são armazenados em servidores seguros e utilizamos medidas técnicas 
                e administrativas para proteger suas informações contra acesso não autorizado, 
                alteração, divulgação ou destruição.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>5. Seus Direitos (LGPD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-muted-foreground">
                <p>De acordo com a Lei Geral de Proteção de Dados, você tem direito a:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                  <li>Solicitar a exclusão de dados desnecessários ou excessivos</li>
                  <li>Revogar consentimento a qualquer momento</li>
                  <li>Solicitar a portabilidade dos dados</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>6. Cookies e Tecnologias Similares</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
                lembrar suas preferências e analisar o uso do aplicativo. Você pode 
                gerenciar suas preferências de cookies através das configurações do navegador.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>7. Alterações na Política</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta política pode ser atualizada periodicamente. Alterações significativas 
                serão comunicadas através do aplicativo ou por e-mail.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>8. Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                entre em contato conosco através dos canais oficiais da Tromot disponíveis 
                em nosso site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}