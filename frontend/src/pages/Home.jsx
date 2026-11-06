import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function Landing() {
  return (
    <div className="hero p-4 p-md-5 text-center text-md-start">
      <h1 className="mb-3">Every book on the shelf, one search away.</h1>
      <p className="lead col-lg-7 px-0">Find a title, borrow it, and keep track of due dates. Librarians manage the catalogue and members from the same place.</p>
      <div className="d-flex gap-2 justify-content-center justify-content-md-start">
        <Link to="/register" className="btn btn-warning btn-lg">Create account</Link>
        <Link to="/login" className="btn btn-outline-light btn-lg">Log in</Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [s, setS] = useState(null);

  useEffect(() => {
    if (user) api.get('/borrows/stats').then((r) => setS(r.data)).catch(() => {});
  }, [user]);

  if (loading) return null;
  if (!user) return <Landing />;

  const admin = user.role === 'admin';
  const cards = admin
    ? [['Books in catalogue', s?.books], ['Members', s?.members], ['On loan now', s?.active], ['Overdue', s?.overdue]]
    : [['On loan now', s?.active], ['Overdue', s?.overdue], ['Books borrowed so far', s?.total]];

  return (
    <>
      <h2 className="mb-1">Welcome back, {user.name.split(' ')[0]}</h2>
      <p className="text-muted">{admin ? 'Here is how the library is doing today.' : 'Here is where your reading stands.'}</p>
      <div className="row g-3 mb-4">
        {cards.map(([label, n]) => (
          <div key={label} className={admin ? 'col-6 col-lg-3' : 'col-12 col-md-4'}>
            <div className="card stat shadow-sm"><div className="card-body">
              <div className="n">{n ?? '–'}</div><div className="text-muted">{label}</div>
            </div></div>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h4 className="mb-0">{admin ? 'Latest loans' : 'Your latest loans'}</h4>
        <Link to="/loans">See all</Link>
      </div>
      <div className="card shadow-sm border-0"><div className="table-responsive">
        <table className="table mb-0">
          <thead><tr><th>Book</th>{admin && <th>Member</th>}<th>Due</th><th>Status</th></tr></thead>
          <tbody>
            {s?.recent?.length ? s.recent.map((b) => (
              <tr key={b._id}>
                <td>{b.book?.title || <em className="text-muted">Deleted book</em>}</td>
                {admin && <td>{b.user?.name}</td>}
                <td>{fmt(b.dueDate)}</td>
                <td>{b.status === 'returned' ? <span className="badge text-bg-secondary">Returned</span> : b.isOverdue ? <span className="badge text-bg-danger">Overdue</span> : <span className="badge text-bg-success">On loan</span>}</td>
              </tr>
            )) : <tr><td colSpan="4" className="text-center text-muted py-4">No loans yet. <Link to="/books">Browse the catalogue</Link> to borrow your first book.</td></tr>}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
