import { fileUrl } from '../api';

export default function Avatar({ user, size = 40 }) {
  const src = fileUrl(user?.avatar);
  const style = { width: size, height: size };
  return src ? (
    <img src={src} alt="" className="avatar" style={style} />
  ) : (
    <span className="avatar d-inline-flex align-items-center justify-content-center text-white fw-bold bg-secondary" style={{ ...style, fontSize: size * 0.4 }}>
      {user?.name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}
