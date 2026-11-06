export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  // show a window of up to 5 page numbers around the current page
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);
  return (
    <nav aria-label="Pagination" className="mt-4">
      <ul className="pagination justify-content-center flex-wrap">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => onChange(page - 1)}>Previous</button></li>
        {nums.map((n) => (
          <li key={n} className={`page-item ${n === page ? 'active' : ''}`}><button className="page-link" onClick={() => onChange(n)}>{n}</button></li>
        ))}
        <li className={`page-item ${page === pages ? 'disabled' : ''}`}><button className="page-link" onClick={() => onChange(page + 1)}>Next</button></li>
      </ul>
    </nav>
  );
}
