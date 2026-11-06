import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email';
    if (!form.password) er.password = 'Password is required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="row justify-content-center"><div className="col-md-6 col-lg-4">
      <h2 className="mb-3">Log in</h2>
      <form onSubmit={submit} noValidate className="card card-body shadow-sm border-0">
        <label className="form-label">Email</label>
        <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
        <div className="invalid-feedback">{errors.email}</div>
        <label className="form-label mt-3">Password</label>
        <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
        <div className="invalid-feedback">{errors.password}</div>
        <button className="btn btn-primary mt-4" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="mt-3 text-center">New here? <Link to="/register">Create an account</Link></p>
    </div></div>
  );
}
