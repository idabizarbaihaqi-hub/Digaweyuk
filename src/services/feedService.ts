import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType, cleanFirestoreData } from '../firebase/errorHandler';
import {
  Post,
  PostType,
  PostLike,
  PostComment,
  SavedPost,
  ModerationReport,
  UserWarning,
  ModerationAppeal,
  ModerationLog,
} from '../types';

export const POSTS_COLLECTION = 'posts';
export const SAVED_POSTS_COLLECTION = 'savedPosts';
export const REPORTS_COLLECTION = 'reports';
export const WARNINGS_COLLECTION = 'userWarnings';
export const APPEALS_COLLECTION = 'moderationAppeals';
export const MODERATION_LOGS_COLLECTION = 'moderationLogs';

// Common scam phrases to protect job seekers
const SCAM_KEYWORDS = [
  'biaya pendaftaran',
  'biaya registrasi',
  'transfer uang',
  'biaya seragam',
  'biaya materi',
  'biaya tes',
  'biaya interview',
  'biaya administrasi',
  'pembelian formulir',
  'bayar diawal',
  'uang jaminan',
];

export function detectScamIntent(text: string): { isScamSuspect: boolean; matched: string[] } {
  const lower = text.toLowerCase();
  const matched = SCAM_KEYWORDS.filter((keyword) => lower.includes(keyword));
  return {
    isScamSuspect: matched.length > 0,
    matched,
  };
}

// ==========================================
// POSTS CRUD
// ==========================================

export async function getFeedPosts(params?: {
  location?: string;
  position?: string;
  openToWorkOnly?: boolean;
  type?: PostType;
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}): Promise<{ posts: Post[]; lastDoc?: DocumentSnapshot }> {
  const colRef = collection(db, POSTS_COLLECTION);
  try {
    // Basic query for approved, active posts ordered by newest
    let q = query(
      colRef,
      where('moderationStatus', '==', 'APPROVED'),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      limit(params?.limitCount || 20)
    );

    if (params?.lastDoc) {
      q = query(q, startAfter(params.lastDoc));
    }

    const snap = await getDocs(q);
    const docs = snap.docs;
    const posts: Post[] = docs.map((d) => ({ id: d.id, ...d.data() } as Post));

    // Client-side filtering for location / position / openToWork to avoid composite index limits
    let filtered = posts;
    if (params?.openToWorkOnly) {
      filtered = filtered.filter((p) => p.openToWork === true || p.type === 'OPEN_TO_WORK');
    }
    if (params?.type) {
      filtered = filtered.filter((p) => p.type === params.type);
    }
    if (params?.location && params.location !== 'Semua Lokasi') {
      const locLower = params.location.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.locationWanted?.toLowerCase().includes(locLower) ||
          p.city?.toLowerCase().includes(locLower)
      );
    }
    if (params?.position && params.position.trim()) {
      const posLower = params.position.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.positionWanted?.toLowerCase().includes(posLower) ||
          p.skills?.some((s) => s.toLowerCase().includes(posLower))
      );
    }

    return {
      posts: filtered,
      lastDoc: docs.length > 0 ? docs[docs.length - 1] : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, POSTS_COLLECTION);
    return { posts: [] };
  }
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const colRef = collection(db, POSTS_COLLECTION);
  try {
    const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, POSTS_COLLECTION);
    return [];
  }
}

export async function createPost(
  userId: string,
  postData: Omit<
    Post,
    | 'id'
    | 'userId'
    | 'likesCount'
    | 'commentsCount'
    | 'createdAt'
    | 'updatedAt'
    | 'moderationStatus'
  >
): Promise<string> {
  const colRef = collection(db, POSTS_COLLECTION);
  try {
    const now = new Date().toISOString();
    const scamCheck = detectScamIntent(`${postData.content} ${postData.positionWanted}`);

    const newDocData: Omit<Post, 'id'> = {
      ...postData,
      userId,
      likesCount: 0,
      commentsCount: 0,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      saveCount: 0,
      viewsCount: 0,
      status: 'ACTIVE',
      visibility: postData.visibility || 'PUBLIC',
      // If scam keywords detected, set to PENDING for admin moderation review
      moderationStatus: scamCheck.isScamSuspect ? 'PENDING' : 'APPROVED',
      flaggedAsScam: scamCheck.isScamSuspect,
      scamWarningText: scamCheck.isScamSuspect
        ? 'Perhatian: Postingan ini ditandai berisiko karena menyebutkan permintaan biaya atau transaksi.'
        : '',
      createdAt: now,
      updatedAt: now,
    };

    const cleanedDocData = cleanFirestoreData(newDocData);
    const docRef = await addDoc(colRef, cleanedDocData);
    // Update with postId
    await updateDoc(docRef, { postId: docRef.id });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, POSTS_COLLECTION);
  }
}

export async function updatePost(postId: string, postData: Partial<Post>): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId);
  try {
    const now = new Date().toISOString();
    await updateDoc(
      docRef,
      cleanFirestoreData({
        ...postData,
        updatedAt: now,
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, POSTS_COLLECTION);
  }
}

export async function deletePost(postId: string): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, POSTS_COLLECTION);
  }
}

export async function markPostGotJob(postId: string): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId);
  try {
    await updateDoc(docRef, {
      openToWork: false,
      status: 'CLOSED',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, POSTS_COLLECTION);
  }
}

// ==========================================
// LIKE SYSTEM (Single like per user in subcollection)
// ==========================================

export async function toggleLikePost(
  postId: string,
  userId: string,
  userName: string
): Promise<{ liked: boolean; newCount: number }> {
  const likeDocRef = doc(db, POSTS_COLLECTION, postId, 'likes', userId);
  const postDocRef = doc(db, POSTS_COLLECTION, postId);

  try {
    const likeSnap = await getDoc(likeDocRef);
    if (likeSnap.exists()) {
      // User already liked, so unlike
      await deleteDoc(likeDocRef);
      await updateDoc(postDocRef, {
        likesCount: increment(-1),
      });
      const postSnap = await getDoc(postDocRef);
      const curCount = postSnap.data()?.likesCount || 0;
      return { liked: false, newCount: Math.max(0, curCount) };
    } else {
      // Like
      await setDoc(likeDocRef, {
        id: userId,
        postId,
        userId,
        userName,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(postDocRef, {
        likesCount: increment(1),
      });
      const postSnap = await getDoc(postDocRef);
      const curCount = postSnap.data()?.likesCount || 1;
      return { liked: true, newCount: curCount };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${POSTS_COLLECTION}/${postId}/likes`);
    return { liked: false, newCount: 0 };
  }
}

export async function checkUserLikedPost(postId: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  const likeDocRef = doc(db, POSTS_COLLECTION, postId, 'likes', userId);
  try {
    const snap = await getDoc(likeDocRef);
    return snap.exists();
  } catch {
    return false;
  }
}

// ==========================================
// COMMENT SYSTEM
// ==========================================

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const colRef = collection(db, POSTS_COLLECTION, postId, 'comments');
  try {
    const q = query(colRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PostComment));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${POSTS_COLLECTION}/${postId}/comments`);
    return [];
  }
}

export async function addPostComment(
  postId: string,
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  content: string
): Promise<PostComment> {
  const colRef = collection(db, POSTS_COLLECTION, postId, 'comments');
  const postDocRef = doc(db, POSTS_COLLECTION, postId);

  try {
    const now = new Date().toISOString();
    const commentData: Omit<PostComment, 'id'> = {
      postId,
      userId,
      userName,
      userAvatar: userAvatar || '',
      content: content.trim(),
      moderationStatus: 'APPROVED',
      createdAt: now,
      updatedAt: now,
    };

    const cleanedCommentData = cleanFirestoreData(commentData);
    const docRef = await addDoc(colRef, cleanedCommentData);
    await updateDoc(postDocRef, {
      commentsCount: increment(1),
    });

    return { id: docRef.id, ...cleanedCommentData };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${POSTS_COLLECTION}/${postId}/comments`);
    throw error;
  }
}

export async function deletePostComment(postId: string, commentId: string): Promise<void> {
  const commentDocRef = doc(db, POSTS_COLLECTION, postId, 'comments', commentId);
  const postDocRef = doc(db, POSTS_COLLECTION, postId);

  try {
    await deleteDoc(commentDocRef);
    await updateDoc(postDocRef, {
      commentsCount: increment(-1),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${POSTS_COLLECTION}/${postId}/comments`);
  }
}

// ==========================================
// SAVED POSTS
// ==========================================

export async function savePost(userId: string, postId: string, postTitle?: string): Promise<void> {
  const docId = `${userId}_${postId}`;
  const docRef = doc(db, SAVED_POSTS_COLLECTION, docId);
  try {
    await setDoc(docRef, {
      id: docId,
      userId,
      postId,
      postTitle: postTitle || 'Postingan Pencari Kerja',
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SAVED_POSTS_COLLECTION);
  }
}

export async function unsavePost(userId: string, postId: string): Promise<void> {
  const docId = `${userId}_${postId}`;
  const docRef = doc(db, SAVED_POSTS_COLLECTION, docId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, SAVED_POSTS_COLLECTION);
  }
}

export async function checkPostSaved(userId: string, postId: string): Promise<boolean> {
  if (!userId) return false;
  const docId = `${userId}_${postId}`;
  const docRef = doc(db, SAVED_POSTS_COLLECTION, docId);
  try {
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getUserSavedPosts(userId: string): Promise<SavedPost[]> {
  const colRef = collection(db, SAVED_POSTS_COLLECTION);
  try {
    const q = query(colRef, where('userId', '==', userId), orderBy('savedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedPost));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, SAVED_POSTS_COLLECTION);
    return [];
  }
}

export async function getSavedPostsWithDetails(userId: string): Promise<Post[]> {
  const savedItems = await getUserSavedPosts(userId);
  if (savedItems.length === 0) return [];

  const postPromises = savedItems.map(async (item) => {
    try {
      const pDoc = await getDoc(doc(db, POSTS_COLLECTION, item.postId));
      if (pDoc.exists()) {
        return { id: pDoc.id, ...pDoc.data() } as Post;
      }
      return null;
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(postPromises);
  return resolved.filter((p): p is Post => p !== null);
}

export async function incrementShareCount(postId: string): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId);
  try {
    await updateDoc(docRef, {
      shareCount: increment(1),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error incrementing share count:', err);
  }
}

export async function incrementViewCount(postId: string): Promise<void> {
  const docRef = doc(db, POSTS_COLLECTION, postId);
  try {
    await updateDoc(docRef, {
      viewsCount: increment(1),
    });
  } catch (err) {
    // Non-critical, ignore silent failures
  }
}

// ==========================================
// COMPANY CANDIDATE DISCOVERY
// ==========================================

export async function discoverCandidates(filters?: {
  position?: string;
  location?: string;
  education?: string;
  experience?: string;
  skill?: string;
  employmentType?: string;
  openToWorkOnly?: boolean;
}): Promise<Post[]> {
  const colRef = collection(db, POSTS_COLLECTION);
  try {
    const q = query(
      colRef,
      where('moderationStatus', '==', 'APPROVED'),
      where('status', '==', 'ACTIVE'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snap = await getDocs(q);
    let results: Post[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));

    if (filters?.openToWorkOnly !== false) {
      results = results.filter((p) => p.openToWork === true);
    }
    if (filters?.position && filters.position.trim()) {
      const pLower = filters.position.toLowerCase();
      results = results.filter((p) => p.positionWanted?.toLowerCase().includes(pLower));
    }
    if (filters?.location && filters.location !== 'Semua Lokasi') {
      const locLower = filters.location.toLowerCase();
      results = results.filter(
        (p) =>
          p.locationWanted?.toLowerCase().includes(locLower) ||
          p.city?.toLowerCase().includes(locLower)
      );
    }
    if (filters?.education && filters.education !== 'Semua Pendidikan') {
      results = results.filter((p) => p.education === filters.education);
    }
    if (filters?.experience && filters.experience !== 'Semua Pengalaman') {
      results = results.filter((p) => p.experience === filters.experience);
    }
    if (filters?.employmentType && filters.employmentType !== 'Semua Tipe') {
      results = results.filter((p) => p.employmentType === filters.employmentType);
    }
    if (filters?.skill && filters.skill.trim()) {
      const sLower = filters.skill.toLowerCase();
      results = results.filter((p) => p.skills?.some((s) => s.toLowerCase().includes(sLower)));
    }

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, POSTS_COLLECTION);
    return [];
  }
}

// ==========================================
// REPORT & MODERATION SYSTEM
// ==========================================

export async function createModerationReport(
  reportData: Omit<ModerationReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const colRef = collection(db, REPORTS_COLLECTION);
  try {
    const now = new Date().toISOString();
    const docData: Omit<ModerationReport, 'id'> = {
      ...reportData,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(colRef, cleanFirestoreData(docData));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, REPORTS_COLLECTION);
  }
}

export async function getModerationReports(statusFilter?: string): Promise<ModerationReport[]> {
  const colRef = collection(db, REPORTS_COLLECTION);
  try {
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    if (statusFilter && statusFilter !== 'ALL') {
      q = query(colRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'), limit(100));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ModerationReport));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, REPORTS_COLLECTION);
    return [];
  }
}

export async function resolveModerationReport(
  reportId: string,
  adminId: string,
  action: 'RESOLVED' | 'DISMISSED',
  resolutionNotes?: string
): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  try {
    await updateDoc(docRef, {
      status: action,
      resolvedBy: adminId,
      resolutionAction: resolutionNotes || action,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, REPORTS_COLLECTION);
  }
}

// Execute Admin Moderation Action (Warning, Suspension, Ban, Content Removal)
export async function executeModerationAction(params: {
  adminId: string;
  adminEmail: string;
  action: ModerationLog['action'];
  targetType: ModerationLog['targetType'];
  targetId: string;
  targetUserId?: string;
  reason: string;
  durationHours?: number;
}): Promise<void> {
  const { adminId, adminEmail, action, targetType, targetId, targetUserId, reason, durationHours } = params;

  try {
    const now = new Date().toISOString();

    // 1. Audit Log
    const logsCol = collection(db, MODERATION_LOGS_COLLECTION);
    await addDoc(
      logsCol,
      cleanFirestoreData({
        adminId,
        adminEmail,
        action,
        targetType,
        targetId,
        targetUserId: targetUserId || '',
        reason,
        durationHours: durationHours || null,
        createdAt: now,
      })
    );

    // 2. Perform concrete action
    if (action === 'REMOVE_POST') {
      const postRef = doc(db, POSTS_COLLECTION, targetId);
      await updateDoc(postRef, {
        moderationStatus: 'REMOVED',
        status: 'ARCHIVED',
        moderationReason: reason,
        updatedAt: now,
      });
    } else if (action === 'APPROVE_POST') {
      const postRef = doc(db, POSTS_COLLECTION, targetId);
      await updateDoc(postRef, {
        moderationStatus: 'APPROVED',
        status: 'ACTIVE',
        flaggedAsScam: false,
        updatedAt: now,
      });
    } else if (action === 'WARN_USER' && targetUserId) {
      const warningsCol = collection(db, WARNINGS_COLLECTION);
      await addDoc(
        warningsCol,
        cleanFirestoreData({
          userId: targetUserId,
          adminId,
          adminEmail,
          reason,
          severity: 'MEDIUM',
          acknowledged: false,
          createdAt: now,
        })
      );

      // Update user document moderationStatus
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        moderationStatus: 'WARNING',
        warningCount: increment(1),
        updatedAt: now,
      });
    } else if (action === 'SUSPEND_USER' && targetUserId) {
      const hours = durationHours || 24;
      const suspendedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        moderationStatus: 'SUSPENDED',
        suspendedUntil,
        suspensionReason: reason,
        updatedAt: now,
      });
    } else if (action === 'BAN_USER' && targetUserId) {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        moderationStatus: 'BANNED',
        bannedAt: now,
        banReason: reason,
        updatedAt: now,
      });
    } else if (action === 'UNBAN_USER' && targetUserId) {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, {
        moderationStatus: 'ACTIVE',
        suspendedUntil: null,
        suspensionReason: null,
        bannedAt: null,
        banReason: null,
        updatedAt: now,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, MODERATION_LOGS_COLLECTION);
  }
}

// User Warnings
export async function getUserWarnings(userId: string): Promise<UserWarning[]> {
  const colRef = collection(db, WARNINGS_COLLECTION);
  try {
    const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as UserWarning));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, WARNINGS_COLLECTION);
    return [];
  }
}

export async function acknowledgeWarning(warningId: string): Promise<void> {
  const docRef = doc(db, WARNINGS_COLLECTION, warningId);
  try {
    await updateDoc(docRef, { acknowledged: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, WARNINGS_COLLECTION);
  }
}

// Moderation Appeals
export async function submitModerationAppeal(
  appealData: Omit<ModerationAppeal, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const colRef = collection(db, APPEALS_COLLECTION);
  try {
    const now = new Date().toISOString();
    const docData: Omit<ModerationAppeal, 'id'> = {
      ...appealData,
      status: 'PENDING',
      createdAt: now,
    };

    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, APPEALS_COLLECTION);
  }
}

export async function getModerationAppeals(statusFilter?: string): Promise<ModerationAppeal[]> {
  const colRef = collection(db, APPEALS_COLLECTION);
  try {
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    if (statusFilter && statusFilter !== 'ALL') {
      q = query(colRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'), limit(50));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ModerationAppeal));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, APPEALS_COLLECTION);
    return [];
  }
}

export async function resolveModerationAppeal(
  appealId: string,
  adminId: string,
  decision: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<void> {
  const docRef = doc(db, APPEALS_COLLECTION, appealId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const appeal = snap.data() as ModerationAppeal;

    await updateDoc(docRef, {
      status: decision,
      reviewedBy: adminId,
      adminNotes: notes || '',
      reviewedAt: new Date().toISOString(),
    });

    // If approved, unban or restore user
    if (decision === 'APPROVED' && appeal.userId) {
      const userRef = doc(db, 'users', appeal.userId);
      await updateDoc(userRef, {
        moderationStatus: 'ACTIVE',
        suspendedUntil: null,
        suspensionReason: null,
        bannedAt: null,
        banReason: null,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, APPEALS_COLLECTION);
  }
}

// Moderation Stats for Admin Dashboard
export async function getModerationStats(): Promise<{
  totalReports: number;
  pendingReports: number;
  postsUnderReview: number;
  suspendedUsers: number;
  bannedUsers: number;
  warningsCount: number;
  removedCount: number;
}> {
  try {
    const reportsCol = collection(db, REPORTS_COLLECTION);
    const reportsSnap = await getDocs(reportsCol);
    const reports = reportsSnap.docs.map((d) => d.data() as ModerationReport);

    const postsCol = collection(db, POSTS_COLLECTION);
    const postsSnap = await getDocs(postsCol);
    const posts = postsSnap.docs.map((d) => d.data() as Post);

    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    const users = usersSnap.docs.map((d) => d.data() as { moderationStatus?: string });

    const warningsCol = collection(db, WARNINGS_COLLECTION);
    const warningsSnap = await getDocs(warningsCol);

    return {
      totalReports: reports.length,
      pendingReports: reports.filter((r) => r.status === 'OPEN' || r.status === 'REVIEWING').length,
      postsUnderReview: posts.filter((p) => p.moderationStatus === 'PENDING').length,
      suspendedUsers: users.filter((u) => u.moderationStatus === 'SUSPENDED').length,
      bannedUsers: users.filter((u) => u.moderationStatus === 'BANNED').length,
      warningsCount: warningsSnap.size,
      removedCount: posts.filter((p) => p.moderationStatus === 'REMOVED').length,
    };
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    return {
      totalReports: 0,
      pendingReports: 0,
      postsUnderReview: 0,
      suspendedUsers: 0,
      bannedUsers: 0,
      warningsCount: 0,
      removedCount: 0,
    };
  }
}

export async function getModerationLogs(limitCount = 50): Promise<ModerationLog[]> {
  const colRef = collection(db, MODERATION_LOGS_COLLECTION);
  try {
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ModerationLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, MODERATION_LOGS_COLLECTION);
    return [];
  }
}
