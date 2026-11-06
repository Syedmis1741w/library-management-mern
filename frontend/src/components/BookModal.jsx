import { useState } from 'react';
import { toast } from 'react-toastify';
import api, { errMsg, fileUrl } from '../api';

const year = new Date().getFullYear();

export default function BookModal({ book, categories, onClose, onSaved }) {
  const editing = !!book._id;
  const [form, setForm] = useState({
    title: book.title || '', author: book.author || '', isbn: book.isbn || '', category: book.category || '',
    publishedYear: book.publishedYear || '', copies: book.copies || 1, description: book.description || '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const preview = file ? URL.createObjectURL(file) : fileUrl(book.cover);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.author.trim()) e.author = 'Author is required';
    if (!/^[0-9Xx-]{10,17}$/.test(form.isbn.trim())) e.isbn = 'ISBN must be 10-13 digits (hyphens allowed)';
    if (!form.category.trim()) e.category = 'Category is required';
    if (form.publishedYear && (form.publishedYear < 1000 || form.publishedYear > year)) e.publishedYear = `Year must be between 1000 and ${year}`;
    if (!(Number(form.copies) >= 1)) e.copies = 'At least 1 copy';
    if (form.description.length > 1000) e.description = 'Max 1000 characters';
    return e;
  };

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return toast.error('Use a JPG, PNG or WEBP image');
    if (f.size > 2 * 1024 * 1024) return toast.error('Image must be 2 MB or smaller');
    setFile(f);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
    if (file) fd.append('cover', file);
    setSaving(true);
    try {
      if (editing) await api.put(`/books/${book._id}`, fd);
      else await api.post('/books', fd);
      toast.success(editing ? 'Book updated' : 'Book added');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (k, label, props = {}) => (
    <div className={props.col || 'col-md-6'}>
      <label className="form-label">{label}</label>
      <input className={`form-control ${errors[k] ? 'is-invalid' : ''}`} value={form[k]} onChange={set(k)} {...props} />
      <div className="invalid-feedback">{errors[k]}</div>
    </div>
  );

  return (
    <div className="modal d-block modal-backdrop-lite" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <form className="modal-content" onSubmit={submit} noValidate>
          <div className="modal-header">
            <h4 className="modal-title">{editing ? 'Edit book' : 'Add a book'}</h4>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">
            <div className="row g-3">
              {field('title', 'Title', { col: 'col-12' })}
              {field('author', 'Author')}
              {field('isbn', 'ISBN')}
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <input list="cats" className={`form-control ${errors.category ? 'is-invalid' : ''}`} value={form.category} onChange={set('category')} />
                <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
                <div className="invalid-feedback">{errors.category}</div>
              </div>
              {field('publishedYear', 'Published year', { type: 'number', col: 'col-md-3' })}
              {field('copies', 'Copies', { type: 'number', min: 1, col: 'col-md-3' })}
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea rows="3" className={`form-control ${errors.description ? 'is-invalid' : ''}`} value={form.description} onChange={set('description')} />
                <div className="invalid-feedback">{errors.description}</div>
              </div>
              <div className="col-12 d-flex align-items-center gap-3">
                {preview && <img src={preview} alt="Cover preview" style={{ width: 64, height: 86, objectFit: 'cover', borderRadius: 4 }} />}
                <div>
                  <label className="form-label">Cover image (JPG, PNG or WEBP, up to 2 MB)</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="form-control" onChange={pickFile} />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add book'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
