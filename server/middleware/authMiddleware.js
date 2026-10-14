import { auth, isFirebaseConfigured } from '../config/firebase.js';
import { dbService } from '../services/dbService.js';

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const testUserId = req.headers['x-user-id'];

    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1].trim();
    }

    // 1. If Firebase Admin is fully configured and token is not mock
    if (isFirebaseConfigured && token && !token.startsWith('mock_')) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        let user = dbService.getUser(decodedToken.uid);
        if (!user) {
          user = dbService.saveUser({
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: decodedToken.name || decodedToken.email || 'Người dùng SplitMate',
            photoURL: decodedToken.picture || '',
          });
        }
        req.user = user;
        return next();
      } catch (err) {
        console.warn('[AuthMiddleware] Firebase verifyIdToken failed:', err.message);
        return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
      }
    }

    // 2. Demo / Fallback / Development mode with Bearer mock or X-User-Id
    let targetUid = null;
    if (token && token.startsWith('mock_')) {
      targetUid = token.replace('mock_', '');
    } else if (testUserId) {
      targetUid = testUserId;
    }

    if (targetUid) {
      let user = dbService.getUser(targetUid);
      if (!user) {
        // Create user if not present
        user = dbService.saveUser({
          uid: targetUid,
          email: `${targetUid}@splitmate.local`,
          displayName: targetUid.toUpperCase(),
        });
      }
      req.user = user;
      return next();
    }

    // Default to user_a in standalone local dev if no auth header provided, so routes can still be tested directly
    const defaultUser = dbService.getUser('user_a');
    if (defaultUser) {
      req.user = defaultUser;
      return next();
    }

    return res.status(401).json({ error: 'Không tìm thấy thông tin xác thực.' });
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(500).json({ error: 'Lỗi xác thực người dùng.' });
  }
}
