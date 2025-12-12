import type { BadgeTheme } from '@/types';

export const BADGE_THRESHOLDS = [1, 4, 7, 10, 15, 20, 25, 30, 45] as const;

export type BadgeThreshold = typeof BADGE_THRESHOLDS[number];

export interface BadgeDefinition {
  threshold: BadgeThreshold;
  title: string;
  message: string;
  icon: string;
}

export interface GenderedBadgeDefinition {
  threshold: BadgeThreshold;
  title: string | { male: string; female: string; default: string };
  message: string;
  icon: {
    male: string;
    female: string;
    default: string;
  };
}

export type BadgeConfig = BadgeDefinition | GenderedBadgeDefinition;

export const isGenderedBadge = (badge: BadgeConfig): badge is GenderedBadgeDefinition => {
  return typeof badge.icon === 'object';
};

export const PERSISTENCE_BADGES: Record<BadgeTheme, BadgeConfig[]> = {
  space: [
    { threshold: 1, title: 'Passager', message: "Bienvenue à bord !", icon: '✨' },
    { threshold: 4, title: 'Élève Pilote', message: 'Prêt au décollage ?', icon: '🌙' },
    { threshold: 7, title: 'Pilote', message: 'Tu as les commandes.', icon: '🚀' },
    { threshold: 10, title: 'Astronaute', message: 'En route vers les étoiles.', icon: { male: '👨‍🚀', female: '👩‍🚀', default: '🧑‍🚀' } },
    { threshold: 15, title: 'Explorateur Lunaire', message: "Un petit pas pour l'homme...", icon: '🛰️' },
    { threshold: 20, title: 'Voyageur Solaire', message: "Tu brilles comme le soleil.", icon: '☀️' },
    { threshold: 25, title: 'Capitaine', message: "L'équipage t'écoute.", icon: '🌠' },
    { threshold: 30, title: 'Commandant Galactique', message: "L'univers est à toi.", icon: '🪐' },
    { threshold: 45, title: "Gardien de l'Univers", message: 'Protecteur des galaxies.', icon: '🌌' },
  ],
  animals: [
    { threshold: 1, title: 'Petite Fourmi', message: 'Petite mais très costaud !', icon: '🐜' },
    { threshold: 4, title: 'Écureuil Malin', message: 'Tu fais des réserves de savoir.', icon: '🐿️' },
    { threshold: 7, title: 'Renard Rusé', message: 'Tu ne te fais jamais piéger.', icon: '🦊' },
    { threshold: 10, title: 'Guépard Rapide', message: 'Tu calcules à toute vitesse !', icon: '🐆' },
    { threshold: 15, title: 'Dauphin Agile', message: 'Tu navigues dans les tables.', icon: '🐬' },
    { threshold: 20, title: 'Aigle Royal', message: "Tu vois les erreurs de loin.", icon: '🦅' },
    { threshold: 25, title: 'Ours Puissant', message: "Rien ne peut t'arrêter.", icon: '🐻' },
    { threshold: 30, title: 'Roi de la Jungle', message: "C'est toi le patron !", icon: '🦁' },
    { threshold: 45, title: 'Dragon Légendaire', message: 'Tu es un mythe vivant !', icon: '🐉' },
  ],
  heroes: [
    { threshold: 1, title: 'Apprenti', message: 'Ton entraînement commence.', icon: '🎒' },
    { threshold: 4, title: 'Éclaireur', message: 'Ouvre la voie !', icon: '🔦' },
    { threshold: 7, title: 'Justicier', message: 'Tu défends les bonnes réponses.', icon: '🛡️' },
    { threshold: 10, title: 'Super-Vitesse', message: "Plus rapide que l'éclair.", icon: '⚡' },
    { threshold: 15, title: "Ninja de l'Ombre", message: 'Discret et efficace.', icon: '🥷' },
    { threshold: 20, title: 'Mega-Cerveau', message: "Ton esprit est ton arme.", icon: '🧠' },
    { threshold: 25, title: 'Titan', message: "Une force de la nature.", icon: '🦾' },
    { threshold: 30, title: 'Invincible', message: 'Zéro défaut, zéro dégât.', icon: '💥' },
    { threshold: 45, title: { male: 'Super-Héros', female: 'Super-Héroïne', default: 'Super-Héros' }, message: 'Tu as sauvé le monde !', icon: { male: '🦸‍♂️', female: '🦸‍♀️', default: '🦸' } },
  ],
};

export interface UnlockedBadge {
  id: string;
  threshold: number;
  title: string;
  icon: string;
  unlockedAt: string;
}

export const getBadgeIcon = (
  badge: BadgeConfig,
  gender: 'boy' | 'girl' | undefined
): string => {
  if (isGenderedBadge(badge)) {
    if (gender === 'girl') return badge.icon.female;
    if (gender === 'boy') return badge.icon.male;
    return badge.icon.default;
  }
  return badge.icon;
};

export const getBadgeTitle = (
  badge: BadgeConfig,
  gender: 'boy' | 'girl' | undefined
): string => {
  if (isGenderedBadge(badge) && typeof badge.title === 'object') {
    if (gender === 'girl') return badge.title.female;
    if (gender === 'boy') return badge.title.male;
    return badge.title.default;
  }
  return badge.title as string;
};

export const getBadgeForThreshold = (
  theme: BadgeTheme,
  threshold: number
): BadgeConfig | undefined => {
  const badges = PERSISTENCE_BADGES[theme] || PERSISTENCE_BADGES.space;
  return badges.find(b => b.threshold === threshold);
};

export const checkForNewBadge = (
  totalChallengesCompleted: number,
  theme: BadgeTheme,
  existingBadges: UnlockedBadge[],
  gender?: 'boy' | 'girl'
): { newBadge: UnlockedBadge | null; badgeConfig: BadgeConfig | null } => {
  const badges = PERSISTENCE_BADGES[theme] || PERSISTENCE_BADGES.space;

  for (const badge of badges) {
    if (totalChallengesCompleted === badge.threshold) {
      const alreadyUnlocked = existingBadges.some(
        b => b.threshold === badge.threshold
      );

      if (!alreadyUnlocked) {
        const icon = getBadgeIcon(badge, gender);
        const title = getBadgeTitle(badge, gender);
        const newBadge: UnlockedBadge = {
          id: `${theme}_${badge.threshold}`,
          threshold: badge.threshold,
          title,
          icon,
          unlockedAt: new Date().toISOString(),
        };
        return { newBadge, badgeConfig: badge };
      }
    }
  }

  return { newBadge: null, badgeConfig: null };
};

export interface NextBadgeInfo {
  title: string;
  icon: string;
  threshold: number;
  challengesRemaining: number;
}

export const getNextBadgeInfo = (
  totalChallengesCompleted: number,
  theme: BadgeTheme,
  gender?: 'boy' | 'girl'
): NextBadgeInfo | null => {
  const badges = PERSISTENCE_BADGES[theme] || PERSISTENCE_BADGES.space;

  for (const badge of badges) {
    if (badge.threshold > totalChallengesCompleted) {
      const icon = getBadgeIcon(badge, gender);
      const title = getBadgeTitle(badge, gender);
      return {
        title,
        icon,
        threshold: badge.threshold,
        challengesRemaining: badge.threshold - totalChallengesCompleted,
      };
    }
  }

  return null;
};

export interface EnduranceBadgeDefinition {
  threshold: 20 | 30 | 50;
  title: string;
  icon: string;
  backTitle: string;
  backMessage: string;
}

export const ENDURANCE_BADGES: EnduranceBadgeDefinition[] = [
  {
    threshold: 20,
    title: 'Esprit Focus',
    icon: '🧠',
    backTitle: 'Concentré !',
    backMessage: 'Tu restes focus.'
  },
  {
    threshold: 30,
    title: 'Marathonien',
    icon: '🏃',
    backTitle: 'Endurance !',
    backMessage: 'Quelle course !'
  },
  {
    threshold: 50,
    title: 'L\'Everest',
    icon: '🏔️',
    backTitle: 'Sommet !',
    backMessage: '50 questions !'
  }
];
