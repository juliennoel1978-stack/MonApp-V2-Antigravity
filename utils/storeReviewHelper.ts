/**
 * Store Review Helper
 * Gère la logique de demande d'avis sur l'App Store/Play Store
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

// Storage keys
const STORAGE_KEYS = {
    SESSION_COUNT: '@store_review_session_count',
    LAST_REQUESTED: '@store_review_last_requested',
    COMPLETED: '@store_review_completed',
    DECLINED_COUNT: '@store_review_declined_count',
};

// Configuration
const CONFIG = {
    MIN_SESSIONS_BEFORE_PROMPT: 3,
    MIN_TABLES_MASTERED: 2,
    COOLDOWN_DAYS: 7,
    MAX_DECLINED: 3,
    EXCLUDED_TABLES: [1, 10], // Tables trop faciles
};

/**
 * Incrémente le compteur de sessions et retourne la nouvelle valeur
 */
export async function incrementSessionCount(): Promise<number> {
    try {
        const current = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
        const newCount = (parseInt(current || '0', 10) || 0) + 1;
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_COUNT, newCount.toString());
        return newCount;
    } catch (error) {
        console.error('[StoreReview] Error incrementing session count:', error);
        return 0;
    }
}

/**
 * Retourne le nombre de sessions actuelles
 */
export async function getSessionCount(): Promise<number> {
    try {
        const count = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
        return parseInt(count || '0', 10) || 0;
    } catch {
        return 0;
    }
}

/**
 * Vérifie si on peut demander un avis (cooldown, limite, etc.)
 */
export async function canRequestReview(): Promise<boolean> {
    try {
        // Vérifier si l'utilisateur a déjà donné un avis
        const completed = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED);
        if (completed === 'true') {
            console.log('[StoreReview] Skipped: user already reviewed');
            return false;
        }

        // Vérifier le nombre de refus
        const declinedStr = await AsyncStorage.getItem(STORAGE_KEYS.DECLINED_COUNT);
        const declinedCount = parseInt(declinedStr || '0', 10) || 0;
        if (declinedCount >= CONFIG.MAX_DECLINED) {
            console.log('[StoreReview] Skipped: too many declines');
            return false;
        }

        // Vérifier le cooldown
        const lastRequested = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REQUESTED);
        if (lastRequested) {
            const lastDate = new Date(parseInt(lastRequested, 10));
            const now = new Date();
            const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < CONFIG.COOLDOWN_DAYS) {
                console.log(`[StoreReview] Skipped: cooldown active (${Math.ceil(CONFIG.COOLDOWN_DAYS - diffDays)} days remaining)`);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error('[StoreReview] Error checking review eligibility:', error);
        return false;
    }
}

/**
 * Vérifie si on doit demander un avis basé sur le déclencheur
 */
export async function shouldRequestReview(trigger: 'session' | 'mastery'): Promise<boolean> {
    const canRequest = await canRequestReview();
    if (!canRequest) return false;

    if (trigger === 'session') {
        const sessions = await getSessionCount();
        const shouldRequest = sessions >= CONFIG.MIN_SESSIONS_BEFORE_PROMPT;
        console.log(`[StoreReview] Session trigger check: ${sessions} sessions, required: ${CONFIG.MIN_SESSIONS_BEFORE_PROMPT}, result: ${shouldRequest}`);
        return shouldRequest;
    }

    // Pour 'mastery', on suppose que l'appelant a déjà vérifié les conditions de tables
    console.log('[StoreReview] Mastery trigger: eligible');
    return true;
}

/**
 * Compte le nombre de tables maîtrisées (3 étoiles, hors tables 1 et 10)
 */
export function countMasteredTables(progress: { tableNumber: number; starsEarned: number }[]): number {
    return progress.filter(
        p => p.starsEarned >= 3 && !CONFIG.EXCLUDED_TABLES.includes(p.tableNumber)
    ).length;
}

/**
 * Vérifie si l'utilisateur a atteint le seuil de tables maîtrisées
 */
export function hasReachedMasteryThreshold(progress: { tableNumber: number; starsEarned: number }[]): boolean {
    return countMasteredTables(progress) >= CONFIG.MIN_TABLES_MASTERED;
}

/**
 * Marque qu'une demande d'avis a été faite
 */
export async function markReviewRequested(): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_REQUESTED, Date.now().toString());
        console.log('[StoreReview] Marked as requested');
    } catch (error) {
        console.error('[StoreReview] Error marking review requested:', error);
    }
}

/**
 * Marque que l'utilisateur a donné un avis
 */
export async function markReviewCompleted(): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED, 'true');
        await markReviewRequested();
        console.log('[StoreReview] Marked as completed');
    } catch (error) {
        console.error('[StoreReview] Error marking review completed:', error);
    }
}

/**
 * Incrémente le compteur de refus
 */
export async function markReviewDeclined(): Promise<void> {
    try {
        const current = await AsyncStorage.getItem(STORAGE_KEYS.DECLINED_COUNT);
        const newCount = (parseInt(current || '0', 10) || 0) + 1;
        await AsyncStorage.setItem(STORAGE_KEYS.DECLINED_COUNT, newCount.toString());
        await markReviewRequested(); // Applique aussi le cooldown
        console.log(`[StoreReview] Marked as declined (${newCount} times)`);
    } catch (error) {
        console.error('[StoreReview] Error marking review declined:', error);
    }
}

/**
 * Déclenche la demande d'avis native
 */
export async function requestNativeReview(): Promise<boolean> {
    try {
        const isAvailable = await StoreReview.isAvailableAsync();
        if (!isAvailable) {
            console.log('[StoreReview] Native review not available on this platform');
            return false;
        }

        if (await StoreReview.hasAction()) {
            await StoreReview.requestReview();
            console.log('[StoreReview] Native review triggered');
            return true;
        }

        console.log('[StoreReview] No action available');
        return false;
    } catch (error) {
        console.error('[StoreReview] Error requesting native review:', error);
        return false;
    }
}

/**
 * Ouvre la page de l'app store pour laisser un avis (fallback)
 */
export async function openStoreForReview(): Promise<void> {
    try {
        // expo-store-review gère automatiquement iOS vs Android
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            await requestNativeReview();
        }
    } catch (error) {
        console.error('[StoreReview] Error opening store:', error);
    }
}
