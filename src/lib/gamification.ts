export interface Medal {
  id: string;
  name: string;
  description: string;
  icon: string;
  postsRequired: number;
  color: string;
}

export const medals: Medal[] = [
  {
    id: 'fita_isolante',
    name: 'Fita Isolante',
    description: 'Primeira instalação compartilhada',
    icon: '🔧',
    postsRequired: 1,
    color: 'text-gray-600'
  },
  {
    id: 'alicate',
    name: 'Alicate',
    description: '10 instalações compartilhadas',
    icon: '🔨',
    postsRequired: 10,
    color: 'text-blue-600'
  },
  {
    id: 'chave_fenda',
    name: 'Chave de Fenda',
    description: '25 instalações compartilhadas',
    icon: '🪛',
    postsRequired: 25,
    color: 'text-green-600'
  },
  {
    id: 'multimetro',
    name: 'Multímetro',
    description: '50 instalações compartilhadas',
    icon: '⚡',
    postsRequired: 50,
    color: 'text-yellow-600'
  },
  {
    id: 'maleta_ferramentas',
    name: 'Maleta de Ferramentas',
    description: '100 instalações compartilhadas',
    icon: '🧰',
    postsRequired: 100,
    color: 'text-purple-600'
  }
];

export function computeUserMedals(postsCount: number): Medal[] {
  return medals.filter(medal => postsCount >= medal.postsRequired);
}

export function getNextMedal(postsCount: number): Medal | null {
  const nextMedal = medals.find(medal => postsCount < medal.postsRequired);
  return nextMedal || null;
}

export function getProgressToNextMedal(postsCount: number): { current: number; target: number; percentage: number } {
  const nextMedal = getNextMedal(postsCount);
  
  if (!nextMedal) {
    // User has all medals
    return { current: postsCount, target: postsCount, percentage: 100 };
  }
  
  const previousMedal = medals
    .filter(medal => medal.postsRequired <= postsCount)
    .sort((a, b) => b.postsRequired - a.postsRequired)[0];
  
  const previousTarget = previousMedal ? previousMedal.postsRequired : 0;
  const progress = postsCount - previousTarget;
  const total = nextMedal.postsRequired - previousTarget;
  const percentage = Math.round((progress / total) * 100);
  
  return {
    current: postsCount,
    target: nextMedal.postsRequired,
    percentage
  };
}