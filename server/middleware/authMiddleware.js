import { auth, isFirebaseConfigured } from '../config/firebase.js';
import { dbService } from '../services/dbService.js';

function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
      return JSON.parse(payload);
    }
  } catch (e) {
    try {
      const parts = token.split('.');
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = Buffer.from(base64, 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch (e2) {}
  }
  return null;
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const testUserId = req.headers['x-user-id'] || req.query?.userId || req.query?.user_id;

    let token = req.query?.token || req.query?.auth_token || null;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1].trim();
    }

    // 1. If Firebase Admin is fully configured and token is provided
    if (isFirebaseConfigured && token && !token.startsWith('mock_')) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;
        let user = dbService.getUser(uid);
        const dicebearPhoto = (user?.photoURL && !user.photoURL.includes('googleusercontent.com'))
          ? user.photoURL
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`;

        const isRawUidName = !user?.displayName ||
          user.displayName === uid ||
          user.displayName === uid.toUpperCase() ||
          user.displayName.includes(uid);

        if (!user || isRawUidName || (user.email && user.email.includes('@spliqo.local')) || (user.photoURL && user.photoURL.includes('googleusercontent.com'))) {
          const cleanName = decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Người dùng Google');
          user = dbService.saveUser({
            ...(user || {}),
            uid: uid,
            email: decodedToken.email || user?.email || '',
            displayName: cleanName,
            photoURL: dicebearPhoto,
          });
        }
        req.user = user;
        return next();
      } catch (err) {
        console.warn('[AuthMiddleware] Firebase verifyIdToken failed:', err.message);
        return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
      }
    }

    const host = req.headers.host || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER) || (!isLocalhost && process.env.NODE_ENV !== 'test');

    // 2. Client Firebase Token parsing when Admin SDK key is not provided on server (Development/Demo fallback only)
    if (!isFirebaseConfigured && token && !token.startsWith('mock_')) {
      if (isProduction) {
        return res.status(401).json({ error: 'Hệ thống yêu cầu cấu hình Firebase Admin SDK trong môi trường Production.' });
      }

      const decoded = decodeJwtPayload(token);
      if (decoded && (decoded.user_id || decoded.sub)) {
        const uid = decoded.user_id || decoded.sub;
        let user = dbService.getUser(uid);

        const realName = decoded.name || decoded.displayName || '';
        const realEmail = decoded.email || '';
        const dicebearPhoto = (user?.photoURL && !user.photoURL.includes('googleusercontent.com'))
          ? user.photoURL
          : `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`;

        const isRawUidName = !user?.displayName ||
          user.displayName === uid ||
          user.displayName === uid.toUpperCase() ||
          user.displayName.includes(uid) ||
          (user.displayName.length >= 25 && !user.displayName.includes(' '));

        const isDummy = !user ||
          (user.email && user.email.includes('@spliqo.local')) ||
          isRawUidName ||
          (user.photoURL && user.photoURL.includes('googleusercontent.com'));

        if (isDummy || (realName && isRawUidName)) {
          const cleanName = realName || (realEmail ? realEmail.split('@')[0] : 'Người dùng Google');
          user = dbService.saveUser({
            ...(user || {}),
            uid: uid,
            email: realEmail || user?.email || '',
            displayName: cleanName,
            photoURL: dicebearPhoto,
          });
        }
        req.user = user;
        return next();
      }
    }

    // 3. Authenticated requests with X-User-Id or mock token (Strictly Localhost Testing Only)
    let targetUid = null;
    if (token && token.startsWith('mock_')) {
      targetUid = token.replace('mock_', '');
    } else if (testUserId) {
      targetUid = testUserId;
    }

    if (targetUid) {
      if (isProduction) {
        return res.status(401).json({ error: 'Cơ chế giả lập tài khoản (X-User-Id / Mock Token) bị vô hiệu hóa trong môi trường Production.' });
      }

      let user = dbService.getUser(targetUid);
      if (!user) {
        user = dbService.saveUser({
          uid: targetUid,
          email: '',
          displayName: 'Người dùng Spliqo',
        });
      }
      req.user = user;
      return next();
    }

    return res.status(401).json({ error: 'Không tìm thấy thông tin xác thực.' });
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(500).json({ error: 'Lỗi xác thực người dùng.' });
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const testUserId = req.headers['x-user-id'] || req.query?.userId || req.query?.user_id;

    let token = req.query?.token || req.query?.auth_token || null;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1].trim();
    }

    const host = req.headers.host || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER) || (!isLocalhost && process.env.NODE_ENV !== 'test');

    if (isFirebaseConfigured && token && !token.startsWith('mock_')) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        const user = dbService.getUser(decodedToken.uid);
        if (user) req.user = user;
      } catch (_e) {
        // Ignore token errors for optional auth
      }
    } else if (!isProduction && token && !token.startsWith('mock_')) {
      const decoded = decodeJwtPayload(token);
      if (decoded && (decoded.user_id || decoded.sub)) {
        const uid = decoded.user_id || decoded.sub;
        const user = dbService.getUser(uid);
        if (user) req.user = user;
      }
    } else if (!isProduction) {
      let targetUid = null;
      if (token && token.startsWith('mock_')) {
        targetUid = token.replace('mock_', '');
      } else if (testUserId) {
        targetUid = testUserId;
      }
      if (targetUid) {
        const user = dbService.getUser(targetUid);
        if (user) req.user = user;
      }
    }
  } catch (_err) {
    // optional auth never blocks
  }
  return next();
}

