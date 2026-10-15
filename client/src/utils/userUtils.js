export const DEMO_USERS = [];

export const sanitizeDisplayName = (name, uid, email) => {
  if (!name) return email ? email.split('@')[0] : 'Người dùng';
  if (uid && (name === uid || name === uid.toUpperCase() || name.includes(uid))) {
    return email ? email.split('@')[0] : 'Người dùng';
  }
  if (name.length >= 25 && !name.includes(' ')) {
    return email ? email.split('@')[0] : 'Người dùng';
  }
  return name;
};

export const getDicebearAvatar = (uid) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid || 'user'}`;

export const sanitizePhotoURL = (photoURL, uid) => {
  if (!photoURL || photoURL.includes('googleusercontent.com')) {
    return getDicebearAvatar(uid);
  }
  return photoURL;
};

export const getMemberId = (member) => {
  if (!member) return '';
  if (typeof member === 'string') return member;
  return member.userId || member.uid || member.id || '';
};

export const isSameMember = (a, b) => {
  const idA = getMemberId(a);
  const idB = getMemberId(b);
  return Boolean(idA && idB && idA === idB);
};
