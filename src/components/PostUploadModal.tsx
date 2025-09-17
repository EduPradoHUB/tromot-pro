import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface PostUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export function PostUploadModal({ isOpen, onClose, productId }: PostUploadModalProps) {
  const { uploadFile, currentUser } = useApp();
  const [loading, setLoading] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = React.useState({
    caption: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validação de tipo de arquivo
      if (!file.type.startsWith('image/')) {
        console.error("Tipo de arquivo inválido. Por favor, selecione apenas arquivos de imagem.");
        return;
      }

      // Validação de tamanho
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        console.error("Arquivo muito grande. A imagem deve ter no máximo 10MB.");
        return;
      }

      // Aviso para formatos problemáticos
      if (file.type === 'image/heic' || file.type === 'image/heif') {
        console.warn("Imagens HEIC podem ter problemas. Considere converter para JPG.");
      }

      console.log('📷 Imagem selecionada:', { name: file.name, size: file.size, type: file.type });

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile || !formData.caption.trim() || !formData.vehicleBrand.trim() || 
        !formData.vehicleModel.trim() || !formData.vehicleYear.trim()) {
      console.error("Campos obrigatórios. Por favor, preencha todos os campos e selecione uma foto.");
      return;
    }

    if (!currentUser) {
      console.error("Erro. Você precisa estar logado para compartilhar uma instalação.");
      return;
    }

    // Validação adicional de tamanho de arquivo
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      console.error("Arquivo muito grande. A imagem deve ter no máximo 10MB.");
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Iniciando upload de post:', { 
        productId, 
        userId: currentUser.id, 
        fileSize: imageFile.size,
        fileType: imageFile.type 
      });

      // Upload da imagem
      const fileName = `${Date.now()}_${imageFile.name}`;
      const imageUrl = await uploadFile('posts', fileName, imageFile);

      console.log('✅ Upload de imagem concluído:', imageUrl);

      // Criar o post no Supabase
      const postData = {
        product_id: productId,
        author_id: currentUser.id, // Agora usa o auth user ID correto
        photo_url: imageUrl,
        caption: `${formData.caption}\n\nVeículo: ${formData.vehicleBrand} ${formData.vehicleModel} ${formData.vehicleYear}`,
        status: 'pending' as const
      };

      console.log('🔄 Criando post com dados:', postData);

      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar post:', error);
        throw new Error(error.message || 'Erro ao criar post');
      }

      console.log('✅ Post criado com sucesso:', data);

      console.log("Sucesso! Sua instalação foi enviada para análise. Aguarde a aprovação do administrador.");
      
      // Atualizar dados após criação bem-sucedida
      window.location.reload();
      
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('❌ Erro completo no upload de post:', error);
      
      let errorMessage = "Não foi possível enviar sua instalação. Tente novamente.";
      
      if (error.message?.includes('row-level security')) {
        errorMessage = "Erro de permissão. Verifique se você está logado corretamente.";
      } else if (error.message?.includes('Arquivo muito grande')) {
        errorMessage = error.message;
      } else if (error.message?.includes('upload')) {
        errorMessage = "Falha no upload da imagem. Verifique sua conexão e tente novamente.";
      }

      console.error("Erro: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      caption: '',
      vehicleBrand: '',
      vehicleModel: '',
      vehicleYear: ''
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={handleClose}
          />
          <div className="relative bg-background rounded-2xl shadow-lg border max-w-md mx-4 w-full">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Compartilhar Instalação</h2>
              </div>
              <p className="text-muted-foreground mb-6 text-sm">
                Compartilhe sua experiência de instalação com a comunidade
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Upload de Foto */}
                <div className="space-y-2">
                  <Label>Foto da Instalação *</Label>
                  {!imagePreview ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-24 flex flex-col gap-2"
                          onClick={openCamera}
                        >
                          <Camera className="h-6 w-6" />
                          <span className="text-sm">Usar Câmera</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-24 flex flex-col gap-2"
                          onClick={openGallery}
                        >
                          <Image className="h-6 w-6" />
                          <span className="text-sm">Da Galeria</span>
                        </Button>
                      </div>
                      
                      {/* Hidden inputs */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageChange}
                      />
                      <input
                        ref={galleryInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Descrição da Instalação *</Label>
                  <Textarea
                    id="caption"
                    placeholder="Descreva como foi a instalação, dificuldades encontradas, dicas importantes..."
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Dados do Veículo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleBrand">Marca *</Label>
                    <Input
                      id="vehicleBrand"
                      placeholder="Ex: Honda"
                      value={formData.vehicleBrand}
                      onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Modelo *</Label>
                    <Input
                      id="vehicleModel"
                      placeholder="Ex: Civic"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleYear">Ano *</Label>
                  <Input
                    id="vehicleYear"
                    placeholder="Ex: 2023"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Compartilhar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}