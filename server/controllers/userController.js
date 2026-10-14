import { dbService } from '../services/dbService.js';

export async function getProfile(req, res) {
  try {
    const user = req.user;
    return res.json(user);
  } catch (err) {
    console.error('[getProfile] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi tải thông tin hồ sơ.' });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user.uid;
    const {
      displayName,
      phone,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      paymentQrUrl,
      photoURL,
    } = req.body;

    const updated = dbService.saveUser({
      uid: userId,
      ...(displayName ? { displayName: displayName.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
      ...(bankName !== undefined ? { bankName: bankName.trim().toUpperCase() } : {}),
      ...(bankAccountNumber !== undefined ? { bankAccountNumber: bankAccountNumber.trim() } : {}),
      ...(bankAccountHolder !== undefined ? { bankAccountHolder: bankAccountHolder.trim().toUpperCase() } : {}),
      ...(paymentQrUrl !== undefined ? { paymentQrUrl } : {}),
      ...(photoURL !== undefined ? { photoURL } : {}),
    });

    return res.json(updated);
  } catch (err) {
    console.error('[updateProfile] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi cập nhật hồ sơ.' });
  }
}

export async function getAllUsers(req, res) {
  try {
    const users = dbService.getAllUsers();
    // Return public profiles
    return res.json(users.map(u => ({
      uid: u.uid,
      displayName: u.displayName,
      email: u.email,
      photoURL: u.photoURL,
      bankName: u.bankName,
      bankAccountNumber: u.bankAccountNumber,
      bankAccountHolder: u.bankAccountHolder,
    })));
  } catch (err) {
    console.error('[getAllUsers] Error:', err);
    return res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng.' });
  }
}
