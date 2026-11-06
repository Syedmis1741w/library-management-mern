import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Name must be at least 2 characters';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email';
    if (form.password.length < 6) er.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) er.confirm = 'Passwords do not match';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      toast.success('Account created');
      navigate('/');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const input = (k, label, type = 'text', auto) => (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input type={type} autoComplete={auto} className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={form[k]} onChange={set(k)} />
      <div className="invalid-feedback">{errors[k]}</div>
    </div>
  );

  return (
    <div className="row justify-content-center"><div className="col-md-6 col-lg-4">
      <h2 className="mb-3">Create your account</h2>
      <form onSubmit={submit} noValidate className="card card-body shadow-sm border-0">
        {input('name', 'Full name', 'text', 'name')}
        {input('email', 'Email', 'email', 'email')}
        {input('password', 'Password', 'password', 'new-password')}
        {input('confirm', 'Confirm password', 'password', 'new-password')}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="mt-3 text-center">Already a member? <Link to="/login">Log in</Link></p>
    </div></div>
  );
}
