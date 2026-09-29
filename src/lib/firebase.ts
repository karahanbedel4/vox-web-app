import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  QueryDocumentSnapshot,
  onSnapshot,
  increment
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Article, UserProfile, BookmarkItem, UserHistoryItem } from '../types';
import { INITIAL_ARTICLES } from '../data/defaultArticles';
import { appStorage } from './storage';
export { INITIAL_ARTICLES };

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Initialize Firestore with forced long polling for reliable connection in iframe/sandboxed environments
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true
  }, firebaseConfig.firestoreDatabaseId || undefined);
} catch (e) {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
}

export const db = dbInstance;

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account consent'
});

// Automatic listener for Google Auth redirect return on page reload (Sayfa İçi Pop-up'sız Yönlendirme)
if (auth) {
  getRedirectResult(auth)
    .then(async (result) => {
      if (result && result.user) {
        console.log('Google Auth redirect successful:', result.user.email);
        const profile = await syncUserProfile(result.user, {
          communicationConsent: true,
          communicationConsentDate: new Date().toISOString()
        });
        appStorage.setItemSync('vox_local_email_user', JSON.stringify(profile));
        try {
          sessionStorage.removeItem('vox_auth_redirect_pending');
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: profile }));
      }
    })
    .catch((err) => {
      console.warn('getRedirectResult notice:', err);
      try {
        sessionStorage.removeItem('vox_auth_redirect_pending');
      } catch (e) {}
    });
}

// Google ile Aynı Sayfada Yönlendirmeli Giriş
export async function signInWithGoogleRedirect(communicationConsent: boolean = true) {
  try {
    sessionStorage.setItem('vox_auth_redirect_pending', '1');
    sessionStorage.setItem('vox_consent', communicationConsent ? '1' : '0');
  } catch (e) {}

  return await signInWithRedirect(auth, googleProvider);
}

// Google Identity Services (GIS) fallback for preview domains (*.run.app)
export async function signInWithGoogleGIS(communicationConsent: boolean = true) {
  const consentDate = new Date().toISOString();
  const clientId = (firebaseConfig as any).oAuthClientId || '890842275987-rd9l3ups221qge9sna5ne9bskdab5ubh.apps.googleusercontent.com';

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Tarayıcı ortamı gereklidir.'));
      return;
    }

    const runGIS = () => {
      try {
        const client = (window as any).google?.accounts?.oauth2?.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || 'Google oturum açma iptal edildi veya hata oluştu.'));
              return;
            }
            try {
              const accessToken = response.access_token;
              const credential = GoogleAuthProvider.credential(null, accessToken);
              const res = await signInWithCredential(auth, credential);
              if (res?.user) {
                const profile = await syncUserProfile(res.user, {
                  communicationConsent,
                  communicationConsentDate: consentDate
                });
                appStorage.setItemSync('vox_local_email_user', JSON.stringify(profile));
                window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: profile }));
                resolve({ user: res.user, profile });
              } else {
                resolve(res);
              }
            } catch (err: any) {
              reject(err);
            }
          }
        });
        if (client) {
          client.requestAccessToken();
        } else {
          reject(new Error('Google kimlik doğrulama istemcisi başlatılamadı.'));
        }
      } catch (err: any) {
        reject(err);
      }
    };

    if (!(window as any).google?.accounts?.oauth2) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => runGIS();
      script.onerror = () => reject(new Error('Google Giriş betiği yüklenemedi.'));
      document.head.appendChild(script);
    } else {
      runGIS();
    }
  });
}

// Unified Google Sign In Helper
export async function signInWithGoogle(communicationConsent: boolean = true, preferRedirect: boolean = false) {
  const consentDate = new Date().toISOString();
  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  // In standard browser tabs (not iframes), redirect can be preferred if requested
  if (preferRedirect && !isInsideIframe) {
    return await signInWithGoogleRedirect(communicationConsent);
  }

  try {
    const res = await signInWithPopup(auth, googleProvider);
    if (res?.user) {
      const profile = await syncUserProfile(res.user, {
        communicationConsent,
        communicationConsentDate: consentDate
      });
      appStorage.setItemSync('vox_local_email_user', JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: profile }));
      return { user: res.user, profile };
    }
    return res;
  } catch (err: any) {
    console.warn('signInWithPopup notice:', err?.code, err?.message || err);

    // If unauthorized-domain (e.g. preview run.app domain), automatically fallback to Google GIS token flow
    if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('yetkili alan'))) {
      console.log('Unauthorized domain detected. Falling back to Google GIS flow...');
      return await signInWithGoogleGIS(communicationConsent);
    }

    // If popup was blocked and we are NOT in an iframe, attempt redirect
    if (
      !isInsideIframe &&
      (err?.code === 'auth/popup-blocked' ||
       err?.code === 'auth/cancelled-popup-request' ||
       (err?.message && err.message.toLowerCase().includes('popup')))
    ) {
      console.log('Pop-up engellendiği tespit edildi, aynı sayfada yönlendirme başlatılıyor...');
      return await signInWithGoogleRedirect(communicationConsent);
    }

    if (err?.code === 'auth/popup-closed-by-user') {
      throw new Error('Giriş penceresi kapatıldı.');
    }

    if (err?.code === 'auth/popup-blocked') {
      throw new Error('Tarayıcınız açılır pencereyi (pop-up) engelledi. Lütfen adres çubuğundan pop-up izni verin veya e-posta ile giriş yapın.');
    }

    if (err?.code === 'auth/operation-not-supported-in-this-environment') {
      throw new Error('Önizleme çerçevesinde (iframe) doğrudan Google yönlendirmesi desteklenmiyor. Lütfen e-posta ile giriş yapın veya uygulamayı yeni sekmede açın.');
    }

    throw err;
  }
}

export async function signOutApp() {
  await appStorage.removeItem('vox_local_email_user');
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('vox_local_email_user');
  }
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Signout warning:', e);
  }
}

export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, signInWithPopup, signOut, onAuthStateChanged };

// Standard Secure Email Sign In Helper
export async function robustEmailSignIn(emailInput: string, passwordInput: string): Promise<UserProfile> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!cleanEmail || !password) {
    throw new Error('Lütfen e-posta ve şifrenizi girin.');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    if (cred?.user) {
      const profile = await syncUserProfile(cred.user);
      appStorage.setItemSync('vox_local_email_user', JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: profile }));
      return profile;
    }
  } catch (signInErr: any) {
    if (
      signInErr.code === 'auth/user-not-found' || 
      signInErr.code === 'auth/invalid-credential' ||
      signInErr.code === 'auth/wrong-password'
    ) {
      throw new Error('E-posta adresi veya şifre hatalı.');
    }
    if (signInErr.code === 'auth/invalid-email') {
      throw new Error('Geçersiz e-posta adresi formatı.');
    }
    if (signInErr.code === 'auth/too-many-requests') {
      throw new Error('Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyin.');
    }
    throw signInErr;
  }

  throw new Error('Giriş yapılırken bir hata oluştu.');
}

// Standard Secure Email Sign Up Helper
export async function robustEmailSignUp(emailInput: string, passwordInput: string): Promise<UserProfile> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!cleanEmail || !password) {
    throw new Error('Lütfen e-posta ve şifrenizi girin.');
  }

  if (password.length < 6) {
    throw new Error('Şifre en az 6 karakter olmalıdır.');
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (cred?.user) {
      const profile = await syncUserProfile(cred.user);
      appStorage.setItemSync('vox_local_email_user', JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: profile }));
      return profile;
    }
  } catch (signUpErr: any) {
    if (signUpErr.code === 'auth/email-already-in-use') {
      throw new Error('Bu e-posta adresi ile kayıtlı bir hesap zaten var. Lütfen giriş yapın.');
    }
    if (signUpErr.code === 'auth/weak-password') {
      throw new Error('Şifre çok zayıf. Lütfen en az 6 karakterlik güçlü bir şifre girin.');
    }
    if (signUpErr.code === 'auth/invalid-email') {
      throw new Error('Geçersiz e-posta adresi formatı.');
    }
    throw signUpErr;
  }

  throw new Error('Kayıt oluşturulurken bir hata oluştu.');
}

// Anonymous Sign In Helper
export async function ensureAuthUser(): Promise<FirebaseUser | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err: any) {
    console.info('Firebase Anonymous Auth is restricted or unavailable; operating in local guest session mode.');
    return null;
  }
}

// Robust Guest Sign-In Helper (Firebase Anonymous + Fallback Local Session)
export async function signInAsGuest(): Promise<UserProfile> {
  let user: FirebaseUser | null = null;
  try {
    const anonPromise = signInAnonymously(auth);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 2500)
    );
    const cred = await Promise.race([anonPromise, timeoutPromise]) as any;
    user = cred?.user || null;
  } catch (err: any) {
    console.info('Firebase Anonymous Auth unavailable or timed out, using instant local guest mode:', err?.message || err);
  }

  if (user) {
    try {
      const profile = await syncUserProfile(user);
      appStorage.setItemSync('vox_local_guest_user', JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: profile }));
      return profile;
    } catch (syncErr) {
      console.error('Error syncing guest profile, using local fallback profile:', syncErr);
    }
  }

  const guestId = appStorage.getItemSync('vox_guest_uid') || `guest_${Date.now()}`;
  appStorage.setItemSync('vox_guest_uid', guestId);

  const guestProfile: UserProfile = {
    uid: guestId,
    displayName: 'Misafir Kullanıcı',
    email: 'misafir@vox.app',
    photoURL: '',
    birthdate: '1998-05-14',
    authProvider: 'guest',
    isPremium: false,
    subscriptionTier: 'free',
    dailyQuotaUsed: 0,
    lastQuotaResetDate: new Date().toISOString().split('T')[0],
    focusScore: 92,
    streakCount: 0,
    weeklyMinutes: 0,
    totalArticlesRead: 0,
    totalListenedMinutes: 0,
    createdAt: new Date().toISOString()
  };

  appStorage.setItemSync('vox_local_guest_user', JSON.stringify(guestProfile));
  window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: guestProfile }));
  return guestProfile;
}

// User Profile Sync
export async function syncUserProfile(user: FirebaseUser, additionalData?: Partial<UserProfile>): Promise<UserProfile> {
  let localStats = { totalListenedSeconds: 0, totalArticlesRead: 0 };
  try {
    const s = appStorage.getItemSync('vox_user_stats');
    if (s) localStats = JSON.parse(s);
  } catch (e) {}

  const listenedMins = Math.floor(localStats.totalListenedSeconds / 60);
  const isGuest = user.isAnonymous;
  const isGoogle = user.providerData.some(p => p.providerId === 'google.com') || !!user.photoURL;

  const computedDisplayName = user.displayName || (isGuest ? 'Misafir Kullanıcı' : (user.email ? user.email.split('@')[0] : 'VOX Kullanıcısı'));
  const computedEmail = user.email || (isGuest ? 'misafir@vox.app' : '');
  const computedPhotoURL = user.photoURL || '';

  const today = new Date().toISOString().split('T')[0];

  const fallbackProfile: UserProfile = {
    uid: user.uid,
    displayName: computedDisplayName,
    email: computedEmail,
    photoURL: computedPhotoURL,
    birthdate: '1998-05-14',
    authProvider: isGoogle ? 'google' : (isGuest ? 'guest' : 'email'),
    isPremium: false,
    subscriptionTier: 'free',
    dailyQuotaUsed: 0,
    lastQuotaResetDate: today,
    focusScore: listenedMins > 0 ? Math.min(100, Math.round(listenedMins * 0.5)) : 92,
    streakCount: listenedMins > 0 ? 1 : 0,
    weeklyMinutes: listenedMins,
    totalArticlesRead: localStats.totalArticlesRead || 0,
    totalListenedMinutes: listenedMins,
    communicationConsent: additionalData?.communicationConsent ?? true,
    communicationConsentDate: additionalData?.communicationConsentDate || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...additionalData
  };

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const isNewDay = data.lastQuotaResetDate !== today;
      const dailyQuotaUsed = isNewDay ? 0 : (data.dailyQuotaUsed || 0);
      const lastQuotaResetDate = today;

      const updatedProfile: UserProfile = {
        ...data,
        displayName: user.displayName || data.displayName || computedDisplayName,
        email: user.email || data.email || computedEmail,
        photoURL: user.photoURL || data.photoURL || computedPhotoURL,
        authProvider: isGoogle ? 'google' : (isGuest ? 'guest' : data.authProvider || 'email'),
        dailyQuotaUsed,
        lastQuotaResetDate,
        totalArticlesRead: data.totalArticlesRead ?? localStats.totalArticlesRead ?? 0,
        totalListenedMinutes: (data.totalListenedMinutes || 0) + listenedMins,
        weeklyMinutes: (data.weeklyMinutes || 0) + listenedMins,
        focusScore: Math.min(100, Math.round(((data.weeklyMinutes || 0) + listenedMins) * 0.5)),
        ...additionalData
      };

      try {
        const updatePayload: Record<string, any> = {
          displayName: updatedProfile.displayName,
          email: updatedProfile.email,
          photoURL: updatedProfile.photoURL,
          authProvider: updatedProfile.authProvider,
          dailyQuotaUsed: updatedProfile.dailyQuotaUsed,
          lastQuotaResetDate: updatedProfile.lastQuotaResetDate,
          weeklyMinutes: updatedProfile.weeklyMinutes,
          focusScore: updatedProfile.focusScore,
          totalArticlesRead: updatedProfile.totalArticlesRead
        };

        if (additionalData?.communicationConsent !== undefined) {
          updatePayload.communicationConsent = additionalData.communicationConsent;
          updatePayload.communicationConsentDate = additionalData.communicationConsentDate || new Date().toISOString();
        }

        await updateDoc(userRef, updatePayload);
      } catch (err) {
        console.warn('Error updating profile in Firestore (offline mode active):', err);
      }

      return updatedProfile;
    } else {
      try {
        await setDoc(userRef, fallbackProfile);
      } catch (err) {
        console.warn('Error creating profile in Firestore (offline mode active):', err);
      }
      return fallbackProfile;
    }
  } catch (err) {
    console.warn('Firestore user sync unreachable, operating in local offline mode:', err);
    return fallbackProfile;
  }
}

// Increment User Daily Quota Used in Firestore
export async function incrementUserQuota(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const isNewDay = data.lastQuotaResetDate !== today;
      const currentQuota = isNewDay ? 0 : (data.dailyQuotaUsed || 0);
      const newQuotaUsed = currentQuota + 1;

      await updateDoc(userRef, {
        dailyQuotaUsed: newQuotaUsed,
        lastQuotaResetDate: today
      });
      return newQuotaUsed;
    } else {
      await setDoc(userRef, {
        uid: userId,
        dailyQuotaUsed: 1,
        lastQuotaResetDate: today
      }, { merge: true });
      return 1;
    }
  } catch (err) {
    console.warn('Notice incrementing user quota in Firestore (fallback to local):', err);
    return 1;
  }
}

// Update User Focus Score
export async function addFocusMinutes(userId: string, minutes: number = 5): Promise<{ weeklyMinutes: number; focusScore: number }> {
  let weeklyMinutes = minutes;
  let focusScore = Math.min(100, Math.round(85 + (minutes / 60) * 1.2));

  // Sync with local stats cache for seamless instant updates
  try {
    const s = appStorage.getItemSync('vox_user_stats');
    if (s) {
      const parsed = JSON.parse(s);
      const totalSecs = (parsed.totalListenedSeconds || 0) + (minutes * 60);
      const totalMins = Math.floor(totalSecs / 60);
      weeklyMinutes = totalMins;
      focusScore = Math.min(100, Math.round(85 + (totalMins / 60) * 1.2));
      appStorage.setItemSync('vox_user_stats', JSON.stringify({ ...parsed, totalListenedSeconds: totalSecs }));
    }
  } catch (err) {}

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const newWeekly = (data.weeklyMinutes || 0) + minutes;
      const newScore = Math.min(100, Math.round(85 + (newWeekly / 60) * 1.2));
      weeklyMinutes = newWeekly;
      focusScore = newScore;
      await updateDoc(userRef, {
        weeklyMinutes: newWeekly,
        focusScore: newScore
      });
    } else {
      await setDoc(userRef, {
        uid: userId,
        weeklyMinutes,
        focusScore
      }, { merge: true });
    }
  } catch (e) {
    console.warn('Notice updating focus score in Firestore (operating in local state mode):', e);
  }

  return { weeklyMinutes, focusScore };
}

// Increment User Total Articles Read (Lightweight counter - avoiding data bloat)
export async function incrementUserArticlesRead(userId?: string): Promise<number> {
  let localStats = { totalListenedSeconds: 0, totalArticlesRead: 0 };
  try {
    const s = appStorage.getItemSync('vox_user_stats');
    if (s) localStats = JSON.parse(s);
  } catch (e) {}

  localStats.totalArticlesRead = (localStats.totalArticlesRead || 0) + 1;
  try {
    appStorage.setItemSync('vox_user_stats', JSON.stringify(localStats));
  } catch (e) {}

  // Update in Firestore if user is authenticated and not a generic guest
  if (userId && !userId.startsWith('guest_')) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        totalArticlesRead: increment(1)
      });
    } catch (e) {
      console.warn('Firestore article read increment notice:', e);
    }
  }

  // Update cached local profile
  try {
    const raw = appStorage.getItemSync('vox_local_email_user') || appStorage.getItemSync('vox_local_guest_user');
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      parsed.totalArticlesRead = localStats.totalArticlesRead;
      if (parsed.authProvider !== 'guest') {
        appStorage.setItemSync('vox_local_email_user', JSON.stringify(parsed));
      } else {
        appStorage.setItemSync('vox_local_guest_user', JSON.stringify(parsed));
      }
      window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: parsed }));
    }
  } catch (e) {}

  return localStats.totalArticlesRead;
}

// Update User Communication & Newsletter Consent
export async function updateUserCommunicationConsent(userId: string, consent: boolean): Promise<boolean> {
  const dateStr = new Date().toISOString();
  if (userId && !userId.startsWith('guest_')) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        communicationConsent: consent,
        communicationConsentDate: dateStr
      });
    } catch (e) {
      console.warn('Firestore consent update notice:', e);
    }
  }

  // Update cached local profile
  try {
    const raw = appStorage.getItemSync('vox_local_email_user') || appStorage.getItemSync('vox_local_guest_user');
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      parsed.communicationConsent = consent;
      parsed.communicationConsentDate = dateStr;
      if (parsed.authProvider !== 'guest') {
        appStorage.setItemSync('vox_local_email_user', JSON.stringify(parsed));
      } else {
        appStorage.setItemSync('vox_local_guest_user', JSON.stringify(parsed));
      }
      window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: parsed }));
    }
  } catch (e) {}

  return consent;
}

// Reset User Read Stats (Lightweight reset)
export async function resetUserReadStats(userId?: string): Promise<void> {
  try {
    const s = appStorage.getItemSync('vox_user_stats');
    let localStats = { totalListenedSeconds: 0, totalArticlesRead: 0 };
    if (s) localStats = JSON.parse(s);
    localStats.totalArticlesRead = 0;
    appStorage.setItemSync('vox_user_stats', JSON.stringify(localStats));
  } catch (e) {}

  if (userId && !userId.startsWith('guest_')) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { totalArticlesRead: 0 });
    } catch (e) {
      console.warn('Reset read stats notice:', e);
    }
  }

  try {
    const raw = appStorage.getItemSync('vox_local_email_user') || appStorage.getItemSync('vox_local_guest_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.totalArticlesRead = 0;
      if (parsed.authProvider !== 'guest') {
        appStorage.setItemSync('vox_local_email_user', JSON.stringify(parsed));
      } else {
        appStorage.setItemSync('vox_local_guest_user', JSON.stringify(parsed));
      }
      window.dispatchEvent(new CustomEvent('vox_auth_changed', { detail: parsed }));
    }
  } catch (e) {}
}

// Default Seed Articles if Firestore is empty (imported from ../data/defaultArticles)

// Fetch All Articles from Firestore (with fallbacks)
export async function getArticles(): Promise<Article[]> {
  try {
    const colRef = collection(db, 'articles');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Seed default articles to Firestore for initial setup
      for (const item of INITIAL_ARTICLES) {
        await setDoc(doc(colRef, item.id), item);
      }
      return INITIAL_ARTICLES;
    }
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Firestore fetch fallback to local:', err);
    return INITIAL_ARTICLES;
  }
}

export interface PaginatedArticlesResult {
  articles: Article[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

// Fetch Paginated Articles with Cursor (limit + startAfter) and optional Category Filter constraint
export async function getArticlesPaginated(
  pageSize: number = 6,
  lastDocSnapshot: QueryDocumentSnapshot | null = null,
  categoryFilter?: string
): Promise<PaginatedArticlesResult> {
  try {
    const colRef = collection(db, 'articles');
    let q;
    
    // Check if a specific category constraint is requested (other than 'Tümü' or 'Dönüştürülenler')
    const hasCategoryConstraint = categoryFilter && categoryFilter !== 'Tümü' && categoryFilter !== 'Dönüştürülenler';

    if (hasCategoryConstraint) {
      if (lastDocSnapshot) {
        q = query(colRef, where('category', '==', categoryFilter), orderBy('createdAt', 'desc'), startAfter(lastDocSnapshot), limit(pageSize));
      } else {
        q = query(colRef, where('category', '==', categoryFilter), orderBy('createdAt', 'desc'), limit(pageSize));
      }
    } else {
      if (lastDocSnapshot) {
        q = query(colRef, orderBy('createdAt', 'desc'), startAfter(lastDocSnapshot), limit(pageSize));
      } else {
        q = query(colRef, orderBy('createdAt', 'desc'), limit(pageSize));
      }
    }

    let snap;
    try {
      snap = await getDocs(q);
    } catch (queryErr) {
      console.warn('[Firestore Category Query Warning] Fallback without compound index:', queryErr);
      if (hasCategoryConstraint) {
        q = query(colRef, where('category', '==', categoryFilter), limit(pageSize));
      } else {
        q = query(colRef, limit(pageSize));
      }
      snap = await getDocs(q);
    }

    if (snap.empty && !lastDocSnapshot) {
      // Seed initial articles if completely empty
      for (const item of INITIAL_ARTICLES) {
        await setDoc(doc(colRef, item.id), item);
      }
      const filteredSeed = hasCategoryConstraint
        ? INITIAL_ARTICLES.filter(a => a.category === categoryFilter)
        : INITIAL_ARTICLES;

      return {
        articles: filteredSeed.slice(0, pageSize),
        lastDoc: null,
        hasMore: filteredSeed.length > pageSize
      };
    }

    const articles = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as Article));
    const lastVisible = snap.docs[snap.docs.length - 1] || null;
    const hasMore = snap.docs.length === pageSize;

    return {
      articles,
      lastDoc: lastVisible,
      hasMore
    };
  } catch (err) {
    console.warn('Paginated query fallback to local initial articles:', err);
    const filteredSeed = (categoryFilter && categoryFilter !== 'Tümü' && categoryFilter !== 'Dönüştürülenler')
      ? INITIAL_ARTICLES.filter(a => a.category === categoryFilter)
      : INITIAL_ARTICLES;

    return {
      articles: filteredSeed.slice(0, pageSize),
      lastDoc: null,
      hasMore: filteredSeed.length > pageSize
    };
  }
}

// Fetch Articles by Category using direct Firestore constraint
export async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const colRef = collection(db, 'articles');
    let q;
    if (category && category !== 'Tümü' && category !== 'Dönüştürülenler') {
      q = query(colRef, where('category', '==', category));
    } else {
      q = query(colRef, orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as Article));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Firestore getArticlesByCategory fallback:', err);
    if (category && category !== 'Tümü' && category !== 'Dönüştürülenler') {
      return INITIAL_ARTICLES.filter(a => a.category === category);
    }
    return INITIAL_ARTICLES;
  }
}

// Add New Article
export async function saveArticle(article: Omit<Article, 'id'>): Promise<Article> {
  const newId = 'art_' + Date.now();
  const fullArticle: Article = { id: newId, ...article };
  try {
    await setDoc(doc(db, 'articles', newId), fullArticle);
  } catch (err) {
    console.warn('Saved locally due to offline/permission:', err);
  }
  return fullArticle;
}

// Clear Custom User-Added Articles from Firestore
export async function clearCustomArticlesFromFirestore(): Promise<void> {
  try {
    const colRef = collection(db, 'articles');
    const snap = await getDocs(colRef);
    const initialIds = new Set(INITIAL_ARTICLES.map(a => a.id));
    
    const deletePromises: Promise<void>[] = [];
    snap.docs.forEach(d => {
      if (!initialIds.has(d.id)) {
        deletePromises.push(deleteDoc(doc(db, 'articles', d.id)));
      }
    });
    
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Error deleting custom articles from Firestore:', err);
  }
}

// Bookmarks Handling
export async function toggleBookmark(userId: string, articleId: string): Promise<boolean> {
  try {
    const bRef = doc(db, 'bookmarks', `${userId}_${articleId}`);
    const snap = await getDoc(bRef);
    if (snap.exists()) {
      await deleteDoc(bRef);
      return false;
    } else {
      await setDoc(bRef, {
        userId,
        articleId,
        savedAt: new Date().toISOString()
      });
      return true;
    }
  } catch (e) {
    console.warn('Bookmark toggle error:', e);
    return false;
  }
}

export async function getUserBookmarks(userId: string): Promise<string[]> {
  try {
    const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data().articleId);
  } catch (e) {
    return [];
  }
}
