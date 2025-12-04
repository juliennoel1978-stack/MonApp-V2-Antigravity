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
  title: string;
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
    { threshold: 1, title: 'Passager', message: "Bienvenue à bord, l'aventure commence !", icon: '✨' },
    { threshold: 4, title: 'Élève Pilote', message: 'Tu commences à bien gérer les commandes.', icon: '🌙' },
    { threshold: 7, title: 'Pilote', message: 'Paré au décollage, moteurs allumés !', icon: '🚀' },
    { threshold: 10, title: 'Astronaute', message: 'Wouah ! Tu es officiellement en orbite.', icon: { male: '👨‍🚀', female: '👩‍🚀', default: '🧑‍🚀' } },
    { threshold: 15, title: 'Explorateur Lunaire', message: 'Un petit pas pour toi, un grand pas pour les maths.', icon: '🛰️' },
    { threshold: 20, title: 'Voyageur Solaire', message: "Rien ne t'arrête, cap vers les étoiles !", icon: '☀️' },
    { threshold: 25, title: 'Capitaine', message: "C'est toi le chef du vaisseau maintenant.", icon: '🌠' },
    { threshold: 30, title: 'Commandant Galactique', message: "Tu connais l'espace comme ta poche.", icon: '🪐' },
    { threshold: 45, title: "Gardien de l'Univers", message: 'Tu es une légende absolue. Respect !', icon: '🌌' },
  ],
  animals: [
    { threshold: 1, title: 'Petite Fourmi', message: 'Petit mais déjà très costaud !', icon: '🐜' },
    { threshold: 4, title: 'Écureuil Malin', message: 'Tu amasses les bonnes réponses.', icon: '🐿️' },
    { threshold: 7, title: 'Renard Rusé', message: 'On ne te piège pas facilement !', icon: '🦊' },
    { threshold: 10, title: 'Guépard Rapide', message: 'Tu calcules à toute vitesse.', icon: '🐆' },
    { threshold: 15, title: 'Dauphin Agile', message: 'Tu navigues dans les tables avec facilité.', icon: '🐬' },
    { threshold: 20, title: 'Aigle Royal', message: "Tu as l'œil de l'expert, rien ne t'échappe !", icon: '🦅' },
    { threshold: 25, title: 'Ours Puissant', message: "Ta force, c'est ta persévérance.", icon: '🐻' },
    { threshold: 30, title: 'Roi de la Jungle', message: 'Le trône est à toi. Rugis de plaisir !', icon: '🦁' },
    { threshold: 45, title: 'Dragon Légendaire', message: 'Tu es devenu un mythe ! Incroyable.', icon: '🐉' },
  ],
  heroes: [
    { threshold: 1, title: 'Apprenti', message: 'Ton entraînement débute ici.', icon: '🎒' },
    { threshold: 4, title: 'Éclaireur', message: 'Tu ouvres la voie vers la victoire.', icon: '🔦' },
    { threshold: 7, title: 'Justicier', message: 'Tu défends les bonnes réponses !', icon: '🛡️' },
    { threshold: 10, title: 'Super-Vitesse', message: "Plus rapide que l'éclair !", icon: '⚡' },
    { threshold: 15, title: "Ninja de l'Ombre", message: 'Rapide, silencieux et précis.', icon: '🥷' },
    { threshold: 20, title: 'Mega-Cerveau', message: "Ton super-pouvoir ? L'intelligence.", icon: '🧠' },
    { threshold: 25, title: 'Titan', message: "Rien ne peut t'ébranler, tu es solide.", icon: '🦾' },
    { threshold: 30, title: 'Invincible', message: 'Aucune multiplication ne te résiste.', icon: '💥' },
    { threshold: 45, title: 'Super-Héros', message: 'Les autres héros ont ton poster dans leur chambre !', icon: { male: '🦸‍♂️', female: '🦸‍♀️', default: '🦸' } },
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
        const newBadge: UnlockedBadge = {
          id: `${theme}_${badge.threshold}`,
          threshold: badge.threshold,
          title: badge.title,
          icon,
          unlockedAt: new Date().toISOString(),
        };
        return { newBadge, badgeConfig: badge };
      }
    }
  }
  
  return { newBadge: null, badgeConfig: null };
};
