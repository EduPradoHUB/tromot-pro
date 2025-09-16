import * as React from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Camera, Upload } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onUploadComplete?: (avatarUrl: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function AvatarUpload({ currentAvatar, userName, onUploadComplete }: AvatarUploadProps) {
  const { uploadFile } = useApp();
  const [open, setOpen] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState('');
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<Crop>();
  const [aspect] = React.useState<number | undefined>(1); // 1:1 aspect ratio for avatar
  const [uploading, setUploading] = React.useState(false);
  
  const imgRef = React.useRef<HTMLImageElement>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const hiddenAnchorRef = React.useRef<HTMLAnchorElement>(null);
  const blobUrlRef = React.useRef('');

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || ''),
      );
      reader.readAsDataURL(e.target.files[0]);
      setOpen(true);
    }
  };

  const onImageLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (aspect) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspect));
      }
    },
    [aspect],
  );

  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.9);
    });
  };

  const uploadCroppedImage = async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      alert("Por favor, selecione uma área da imagem.");
      return;
    }

    setUploading(true);
    try {
      console.log('🔄 Iniciando upload de avatar...');

      const canvas = previewCanvasRef.current;
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      console.log('📷 Avatar processado:', { name: file.name, size: file.size, type: file.type });
      
      const fileName = `${Date.now()}-${file.name}`;
      const avatarUrl = await uploadFile('avatars', fileName, file);
      
      console.log('✅ Upload de avatar concluído:', avatarUrl);
      
      onUploadComplete?.(avatarUrl);
      setOpen(false);
      setImgSrc('');
      
      alert("Foto de perfil atualizada com sucesso!");
    } catch (error: any) {
      console.error('❌ Erro no upload de avatar:', error);
      
      let errorMessage = "Falha ao fazer upload da imagem.";
      
      if (error.message?.includes('não autenticado')) {
        errorMessage = "Você precisa estar logado para alterar sua foto de perfil.";
      } else if (error.message?.includes('muito grande')) {
        errorMessage = error.message;
      } else if (error.message?.includes('upload')) {
        errorMessage = "Falha no upload. Verifique sua conexão e tente novamente.";
      }

      alert(`Erro: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
      );
    }
  }, [completedCrop]);

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        <div 
          className="h-24 w-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-border"
          onClick={() => setOpen(true)}
        >
          {currentAvatar ? (
            <img src={currentAvatar} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-semibold text-muted-foreground">
              {userName.charAt(0)}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Camera className="h-4 w-4 mr-2" />
            Alterar Foto
          </Button>
          <input
            type="file"
            accept="image/*"
            onChange={onSelectFile}
            className="hidden"
            id="avatar-upload"
          />
          <label htmlFor="avatar-upload">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </span>
            </Button>
          </label>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Foto de Perfil</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {imgSrc && (
              <div>
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  minWidth={100}
                  minHeight={100}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{ transform: `scale(1) rotate(0deg)` }}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-96"
                  />
                </ReactCrop>
              </div>
            )}
            
            {completedCrop && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <canvas
                  ref={previewCanvasRef}
                  className="border rounded-full mx-auto"
                  style={{
                    objectFit: 'contain',
                    width: 150,
                    height: 150,
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={uploadCroppedImage} disabled={uploading || !completedCrop}>
              {uploading ? 'Enviando...' : 'Salvar Foto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Canvas preview function
async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: Crop,
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.restore();
}