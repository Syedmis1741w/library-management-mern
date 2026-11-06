import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import Avatar from '../components/Avatar';

export default function Members() {
  const { user: me } = useAuth();
  const [f, setF] = useState({ q: '', role: '', sort: '-createdAt', page: 1 });
  const [search, setSearch] = useState('');
  const [res, setRes] = useState({ data: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setF((p) => (p.q === search ? p : { ...p, q: search, page: 1 })), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRes((await api.get('/users', { params: { ...f, limit: 10 } })).data); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  }, [f]);
  useEffect(() => { load(); }, [load]);

  const setRole = async (u, role) => {
    try { await api.patch(`/users/${u._id}/role`, { role }); toast.success(`${u.name} is now ${role === 'admin' ? 'an admin' : 'a member'}`); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try { await api.delete(`/users/${u._id}`); toast.success('Member deleted'); if (res.data.length === 1 && f.page > 1) setF({ ...f, page: f.page - 1 }); else load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <>
      <h2 className="mb-3">Members <small className="text-muted fs-6">{res.total} found</small></h2>
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-5"><input className="form-control" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value, page: 1 })}>
            <option value="">All roles</option><option value="user">Members</option><option value="admin">Admins</option>
          </select>
        </div>
        <div className="col-6 col-md-4">
          <select className="form-select" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value, page: 1 })}>
            <option value="-createdAt">Newest first</option><option value="name">Name A–Z</option><option value="-name">Name Z–A</option><option value="email">Email A–Z</option>
          </select>
        </div>
      </div>
      <div className="card shadow-sm border-0"><div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead><tr><th>Member</th><th>Phone</th><th>Role</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="4" className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>
              : res.data.length === 0 ? <tr><td colSpan="4" className="text-center text-muted py-4">No members match your search.</td></tr>
              : res.data.map((u) => (
                <tr key={u._id}>
                  <td><div className="d-flex align-items-center gap-2"><Avatar user={u} /><div><div>{u.name}</div><small className="text-muted">{u.email}</small></div></div></td>
                  <td>{u.phone || '–'}</td>
                  <td>
                    <select className="form-select form-select-sm w-auto" value={u.role} disabled={u._id === me._id} onChange={(e) => setRole(u, e.target.value)}>
                      <option value="user">Member</option><option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="text-end"><button className="btn btn-sm btn-outline-danger" disabled={u._id === me._id} onClick={() => remove(u)}>Delete</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div></div>
      <Pagination page={res.page || 1} pages={res.pages} onChange={(p) => setF({ ...f, page: p })} />
    </>
  );
}
