import * as React from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';

interface EditableContactLinkProps {
  section: string;
  text: string;
  href: string;
  className?: string;
  onUpdate?: (text: string, href: string) => void;
}

export const EditableContactLink: React.FC<EditableContactLinkProps> = ({
  section,
  text,
  href,
  className = "hover:text-foreground",
  onUpdate
}) => {
  const { profile, updateEditableContent } = useApp();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(text);
  const [editHref, setEditHref] = React.useState(href);
  const [loading, setLoading] = React.useState(false);

  const isAdmin = profile?.role === 'ADM';

  const handleSave = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const updated = await updateEditableContent(section, {
        title: editText,
        subtitle: editHref
      });
      
      if (updated) {
        onUpdate?.(editText, editHref);
        setIsEditing(false);
        toast({
          title: "Contato atualizado!",
          description: "As alterações foram salvas com sucesso."
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditText(text);
    setEditHref(href);
    setIsEditing(false);
  };

  if (!isAdmin) {
    return (
      <a
        href={href}
        className={className}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {text}
      </a>
    );
  }

  return (
    <div className="relative group">
      {!isEditing && (
        <Button
          size="sm"
          variant="ghost"
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border z-10"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
      
      {isEditing ? (
        <div className="space-y-4 p-4 bg-slate-800/95 backdrop-blur-sm border rounded-lg shadow-lg min-w-[300px]">
          <div>
            <Label className="text-sm font-medium mb-2 block text-white">Texto exibido</Label>
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Ex: (16) 99303-2002"
              className="text-black"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block text-white">Link/URL</Label>
            <Input
              value={editHref}
              onChange={(e) => setEditHref(e.target.value)}
              placeholder="Ex: tel:+5516993032002 ou mailto:suporte@tromot.com"
              className="text-black"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={loading}
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
              className="text-black hover:text-black"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <a
          href={href}
          className={className}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {text}
        </a>
      )}
    </div>
  );
};