import { useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg, fileUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);
  const preview = file ? URL.createObjectURL(file) : fileUrl(user.avatar);

  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Name must be at least 2 characters';
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) er.phone = 'Enter a valid phone number';
    if (form.address.length > 200) er.address = 'Address is too long (max 200)';
    setErrors(er);
    if (Object.keys(er).length) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('avatar', file);
    setBusy(true);
    try {
      const { data } = await api.put('/users/profile', fd);
      setUser(data.user);
      setFile(null);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const pick = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return toast.error('Use a JPG, PNG or WEBP image');
    if (f.size > 2 * 1024 * 1024) return toast.error('Image must be 2 MB or smaller');
    setFile(f);
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    try {
      await api.put('/users/password', pw);
      toast.success('Password updated');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <h2 className="mb-3">Your profile</h2>
        <form onSubmit={save} noValidate className="card card-body shadow-sm border-0">
          <div className="d-flex align-items-center gap-3 mb-3">
            {preview ? <img src={preview} alt="Profile" className="avatar avatar-lg" /> : <Avatar user={user} size={120} />}
            <div>
              <label className="form-label">Profile photo</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="form-control" onChange={pick} />
            </div>
          </div>
          <label className="form-label">Name</label>
          <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="invalid-feedback">{errors.name}</div>
          <label className="form-label mt-3">Email</label>
          <input className="form-control" value={user.email} disabled />
          <label className="form-label mt-3">Phone</label>
          <input className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="invalid-feedback">{errors.phone}</div>
          <label className="form-label mt-3">Address</label>
          <textarea rows="2" className={`form-control ${errors.address ? 'is-invalid' : ''}`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="invalid-feedback">{errors.address}</div>
          <button className="btn btn-primary mt-4 align-self-start" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>
      </div>
      <div className="col-lg-5">
        <h2 className="mb-3">Change password</h2>
        <form onSubmit={changePw} className="card card-body shadow-sm border-0">
          <label className="form-label">Current password</label>
          <input type="password" className="form-control" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required autoComplete="current-password" />
          <label className="form-label mt-3">New password</label>
          <input type="password" className="form-control" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required minLength={6} autoComplete="new-password" />
          <button className="btn btn-outline-primary mt-4 align-self-start">Update password</button>
        </form>
      </div>
    </div>
  );
}
