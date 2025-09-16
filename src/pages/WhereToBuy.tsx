import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  DistributorPublic, 
  DistributorContact, 
  fetchDistributorsPublic, 
  getDistributorContact,
  logDistributorAccess 
} from '@/lib/distributorUtils';

interface Distributor {
  id: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  state: string;
  city?: string;
  cover_entire_state: boolean;
}

export default function WhereToBuy() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { legacyProducts, profile, trackEvent } = useApp();
  const [product, setProduct] = React.useState<any>(null);
  const [distributors, setDistributors] = React.useState<DistributorPublic[]>([]);
  const [distributorContacts, setDistributorContacts] = React.useState<Map<string, DistributorContact>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [userState, setUserState] = React.useState(profile?.state || '');
  const [userCity, setUserCity] = React.useState(profile?.city || '');
  const [showLocationForm, setShowLocationForm] = React.useState(false);
  const [contactingDistributor, setContactingDistributor] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (id) {
      const foundProduct = legacyProducts.find(p => p.id === id);
      setProduct(foundProduct);
      
      if (!foundProduct) {
        navigate('/manuais');
        return;
      }
    }
  }, [id, legacyProducts, navigate]);

  React.useEffect(() => {
    if (profile?.state && profile?.city) {
      setUserState(profile.state);
      setUserCity(profile.city);
    } else if (!profile?.state || !profile?.city) {
      setShowLocationForm(true);
    }
  }, [profile]);

  React.useEffect(() => {
    if (userState) {
      fetchDistributors();
    }
  }, [userState, userCity]);

  const fetchDistributors = async () => {
    try {
      setLoading(true);
      
      let data: DistributorPublic[] = [];
      
      if (userState && userCity) {
        data = await fetchDistributorsPublic(userState, userCity);
      } else if (userState) {
        data = await fetchDistributorsPublic(userState);
      } else {
        data = await fetchDistributorsPublic();
      }

      setDistributors(data || []);
    } catch (error) {
      console.error('Erro ao buscar distribuidores:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar distribuidores da região.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = async (distributor: Distributor, type: 'phone' | 'whatsapp') => {
    try {
      // Log access to distributor contact information for security audit
      const { error: logError } = await supabase.rpc('log_distributor_access', {
        p_distributor_id: distributor.id,
        p_access_type: type === 'phone' ? 'view_phone' : 'view_whatsapp',
        p_user_location: { 
          state: userState, 
          city: userCity,
          product_id: id
        }
      });

      if (logError) {
        console.warn('Erro ao registrar acesso ao distribuidor:', logError);
      }

      // Track the analytics event
      await trackEvent({
        type: 'distributor_contact_click',
        product_id: id,
        metadata: {
          distributor_id: distributor.id,
          contact_type: type,
          distributor_name: distributor.name,
          user_location: `${userCity}, ${userState}`
        }
      });

      const contact = type === 'phone' ? distributor.phone : distributor.whatsapp;
      
      if (type === 'whatsapp' && contact) {
        // Remove formatting and create WhatsApp link
        const cleanNumber = contact.replace(/\D/g, '');
        const message = `Olá! Vi no app TROMOT PRO que vocês são distribuidores na região. Tenho interesse no produto: ${product.name} (${product.code}).`;
        window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
      } else if (type === 'phone' && contact) {
        window.open(`tel:${contact}`, '_self');
      }
    } catch (error) {
      console.error('Erro ao acessar contato do distribuidor:', error);
      toast({
        title: "Erro",
        description: "Erro ao acessar informações do distribuidor.",
        variant: "destructive",
      });
    }
  };

  const handleLocationSubmit = () => {
    if (userState && userCity) {
      setShowLocationForm(false);
      fetchDistributors();
    } else {
      toast({
        title: "Erro",
        description: "Por favor, preencha estado e cidade.",
        variant: "destructive",
      });
    }
  };

  if (!product) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/manuais')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/produto/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Onde Comprar</h1>
          <p className="text-muted-foreground">{product.name} - {product.code}</p>
        </div>
      </div>

      {/* Location Form */}
      {showLocationForm && (
        <Card className="shadow-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informe sua localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Para encontrar os distribuidores mais próximos, informe sua localização:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Estado"
                value={userState}
                onChange={(e) => setUserState(e.target.value)}
              />
              <Input
                placeholder="Cidade"
                value={userCity}
                onChange={(e) => setUserCity(e.target.value)}
              />
            </div>
            <Button onClick={handleLocationSubmit} className="w-full">
              Buscar Distribuidores
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Distributors List */}
      {!showLocationForm && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Distribuidores em {userCity}, {userState}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLocationForm(true)}
            >
              Alterar localização
            </Button>
          </div>

          {loading ? (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Carregando distribuidores...
              </CardContent>
            </Card>
          ) : distributors.length > 0 ? (
            <div className="grid gap-4">
              {distributors.map((distributor) => (
                <Card key={distributor.id} className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{distributor.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {distributor.cover_entire_state 
                              ? `Todo o estado - ${distributor.state}`
                              : `${distributor.city}, ${distributor.state}`
                            }
                          </span>
                          {distributor.cover_entire_state && (
                            <Badge variant="secondary">Estado completo</Badge>
                          )}
                        </div>
                      </div>
                       <div className="flex gap-2">
                         {distributor.has_contact && (
                           <>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handleContactClick(distributor, 'phone')}
                               disabled={contactingDistributor === distributor.id}
                             >
                               <Phone className="h-4 w-4 mr-2" />
                               {contactingDistributor === distributor.id ? 'Carregando...' : 'Ligar'}
                             </Button>
                             <Button
                               size="sm"
                               onClick={() => handleContactClick(distributor, 'whatsapp')}
                               disabled={contactingDistributor === distributor.id}
                               className="bg-green-600 hover:bg-green-700"
                             >
                               <MessageCircle className="h-4 w-4 mr-2" />
                               {contactingDistributor === distributor.id ? 'Carregando...' : 'WhatsApp'}
                             </Button>
                           </>
                         )}
                         {!distributor.has_contact && (
                           <span className="text-sm text-muted-foreground">
                             Contato: {distributor.phone_display || distributor.whatsapp_display || 'Não informado'}
                           </span>
                         )}
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-6 text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">Nenhum distribuidor encontrado</h3>
                <p>
                  Não encontramos distribuidores cadastrados em {userCity}, {userState}.
                </p>
                <p className="mt-2 mb-4">
                  Você pode comprar diretamente na nossa loja oficial online:
                </p>
                <Button
                  onClick={async () => {
                    await trackEvent({
                      type: 'buy_now_click',
                      product_id: id,
                      metadata: {
                        source: 'where_to_buy_no_distributors',
                        user_location: `${userCity}, ${userState}`
                      }
                    });
                    window.open('https://tromotstore.com.br', '_blank');
                  }}
                  className="w-full sm:w-auto"
                >
                  Comprar na Tromot Store
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}