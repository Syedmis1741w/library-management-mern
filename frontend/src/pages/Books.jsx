import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg, fileUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import BookModal from '../components/BookModal';

export default function Books() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const [f, setF] = useState({ q: '', category: '', available: '', sort: '-createdAt', page: 1 });
  const [search, setSearch] = useState('');
  const [res, setRes] = useState({ data: [], pages: 1, total: 0 });
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null = closed, {} = new book, book = edit

  // debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setF((p) => (p.q === search ? p : { ...p, q: search, page: 1 })), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/books', { params: { ...f, limit: 8 } });
      setRes(data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [f]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/books/categories').then((r) => setCats(r.data)).catch(() => {}); }, [res.total]);

  const borrow = async (id) => {
    try {
      await api.post('/borrows', { bookId: id });
      toast.success('Borrowed. It is due back in 14 days.');
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/books/${b._id}`);
      toast.success('Book deleted');
      // if that was the last item on the page, step back one page
      if (res.data.length === 1 && f.page > 1) setF({ ...f, page: f.page - 1 }); else load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  const change = (k) => (e) => setF({ ...f, [k]: e.target.value, page: 1 });

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 className="mb-0">Books <small className="text-muted fs-6">{res.total} found</small></h2>
        {admin && <button className="btn btn-primary" onClick={() => setModal({})}>Add book</button>}
      </div>

      <div className="row g-2 mb-4">
        <div className="col-12 col-md-4"><input className="form-control" placeholder="Search title, author or ISBN" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={f.category} onChange={change('category')}>
            <option value="">All categories</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select" value={f.available} onChange={change('available')}>
            <option value="">Any status</option>
            <option value="true">Available</option>
          </select>
        </div>
        <div className="col-12 col-md-3">
          <select className="form-select" value={f.sort} onChange={change('sort')}>
            <option value="-createdAt">Newest first</option>
            <option value="title">Title A–Z</option>
            <option value="-title">Title Z–A</option>
            <option value="author">Author A–Z</option>
            <option value="-publishedYear">Year, newest</option>
            <option value="publishedYear">Year, oldest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : res.data.length === 0 ? (
        <div className="text-center text-muted py-5">
          <h5>No books match your search</h5>
          <p>Try a different word or clear the filters.</p>
          <button className="btn btn-outline-primary" onClick={() => { setSearch(''); setF({ q: '', category: '', available: '', sort: '-createdAt', page: 1 }); }}>Clear filters</button>
        </div>
      ) : (
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
          {res.data.map((b) => (
            <div className="col" key={b._id}>
              <div className="card book-card h-100">
                {b.cover ? <img className="book-cover" src={fileUrl(b.cover)} alt={`Cover of ${b.title}`} loading="lazy" /> : <div className="book-cover placeholder">{b.title}</div>}
                <div className="card-body d-flex flex-column">
                  <h6 className="mb-0">{b.title}</h6>
                  <small className="text-muted">{b.author}{b.publishedYear ? `, ${b.publishedYear}` : ''}</small>
                  <div className="my-2">
                    <span className="badge text-bg-light border me-1">{b.category}</span>
                    <span className={`badge ${b.available ? 'text-bg-success' : 'text-bg-danger'}`}>{b.available ? `${b.available} of ${b.copies} in` : 'All out'}</span>
                  </div>
                  <div className="mt-auto d-flex gap-1">
                    <button className="btn btn-sm btn-primary flex-fill" disabled={!b.available} onClick={() => borrow(b._id)}>Borrow</button>
                    {admin && <>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setModal(b)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(b)}>Delete</button>
                    </>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={res.page || 1} pages={res.pages} onChange={(p) => setF({ ...f, page: p })} />

      {modal && <BookModal book={modal} categories={cats} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}
