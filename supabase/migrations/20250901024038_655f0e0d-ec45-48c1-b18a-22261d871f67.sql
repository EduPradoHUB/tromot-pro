-- Primeiro, vamos remover as políticas existentes que causam recursão
DROP POLICY IF EXISTS "ADMs podem gerenciar profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver apenas seu próprio perfil" ON public.profiles;

-- Criar função de segurança definer para verificar se o usuário é ADM
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Criar nova política para ADMs sem recursão
CREATE POLICY "ADMs podem gerenciar profiles" ON public.profiles
FOR ALL USING (public.get_current_user_role() = 'ADM');

-- Política para usuários verem apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir inserção de novos perfis (necessário para criação automática)
CREATE POLICY "Sistema pode criar perfis" ON public.profiles
FOR INSERT WITH CHECK (true);

-- Política para usuários atualizarem apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);