// Avatar options for user profiles
export interface Avatar {
    id: string;
    icon: string;
    label: string;
}

export const AVATARS: Avatar[] = [
    { id: 'tiger', icon: '🐯', label: 'Tigre' },
    { id: 'bear', icon: '🐻', label: 'Ours' },
    { id: 'fox', icon: '🦊', label: 'Renard' },
    { id: 'rocket', icon: '🚀', label: 'Fusée' },
    { id: 'hero', icon: '🦸', label: 'Super-héros' },
    { id: 'star', icon: '⭐', label: 'Étoile' },
    { id: 'unicorn', icon: '🦄', label: 'Licorne' },
    { id: 'robot', icon: '🤖', label: 'Robot' },
];

export const getAvatarById = (id: string): Avatar | undefined => {
    return AVATARS.find(avatar => avatar.id === id);
};

export const getAvatarIcon = (id: string): string => {
    const avatar = getAvatarById(id);
    return avatar?.icon || '👤';
};
