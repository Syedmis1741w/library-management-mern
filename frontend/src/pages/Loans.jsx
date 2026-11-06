import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Loans() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const [f, setF] = useState({ status: '', sort: '-borrowedAt', page: 1 });
  const [res, setRes] = useState({ data: [], pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRes((await api.get('/borrows', { params: { ...f, limit: 10 } })).data); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  }, [f]);
  useEffect(() => { load(); }, [load]);

  const giveBack = async (id) => {
    try {
      const { data } = await api.patch(`/borrows/${id}/return`);
      const fine = data.borrow.fine;
      toast.success(fine ? `Returned. Late fine: ₹${fine}` : 'Returned. Thank you!');
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const badge = (b) => b.status === 'returned' ? <span className="badge text-bg-secondary">Returned</span>
    : b.isOverdue ? <span className="badge text-bg-danger">Overdue</span> : <span className="badge text-bg-success">On loan</span>;

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="mb-0">{admin ? 'All loans' : 'My loans'} <small className="text-muted fs-6">{res.total} total</small></h2>
        <div className="d-flex gap-2">
          <select className="form-select" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value, page: 1 })}>
            <option value="">All statuses</option><option value="borrowed">On loan</option><option value="overdue">Overdue</option><option value="returned">Returned</option>
          </select>
          <select className="form-select" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value, page: 1 })}>
            <option value="-borrowedAt">Newest</option><option value="borrowedAt">Oldest</option><option value="dueDate">Due soonest</option>
          </select>
        </div>
      </div>

      <div className="card shadow-sm border-0"><div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead><tr><th>Book</th>{admin && <th>Member</th>}<th>Borrowed</th><th>Due</th><th>Status</th><th>Fine</th><th /></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>
              : res.data.length === 0 ? <tr><td colSpan="7" className="text-center text-muted py-4">No loans to show.</td></tr>
              : res.data.map((b) => (
                <tr key={b._id}>
                  <td>{b.book ? <><div>{b.book.title}</div><small className="text-muted">{b.book.author}</small></> : <em className="text-muted">Deleted book</em>}</td>
                  {admin && <td>{b.user?.name || <em className="text-muted">Deleted user</em>}</td>}
                  <td>{fmt(b.borrowedAt)}</td>
                  <td>{fmt(b.dueDate)}</td>
                  <td>{badge(b)}</td>
                  <td>{b.currentFine ? `₹${b.currentFine}` : '–'}</td>
                  <td className="text-end">{b.status === 'borrowed' && <button className="btn btn-sm btn-outline-primary" onClick={() => giveBack(b._id)}>Return</button>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div></div>
      <Pagination page={res.page || 1} pages={res.pages} onChange={(p) => setF({ ...f, page: p })} />
    </>
  );
}
