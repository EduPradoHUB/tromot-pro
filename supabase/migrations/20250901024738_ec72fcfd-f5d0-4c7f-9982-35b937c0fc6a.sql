-- Atualizar o usuário edu.prado.tab@gmail.com para ADM
UPDATE public.profiles 
SET role = 'ADM' 
WHERE email = 'edu.prado.tab@gmail.com';