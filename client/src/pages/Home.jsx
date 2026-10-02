import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Loader from '../components/Loader.jsx';
import { CATEGORIES } from '../utils/format.js';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get('/products', { params: { ...filters, page, limit: 12 } })
      .then(({ data }) => {
        if (active) { setProducts(data.products); setTotalPages(data.totalPages); }
      })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page]);

  const update = (key) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  };

  return (
    <section>
      <div className="hero">
        <h1>Everything you need, in one sphere.</h1>
        <p className="muted">Electronics, fashion, books and more — delivered across India.</p>
      </div>

      <div className="filters">
        <input placeholder="Search products..." value={filters.search} onChange={update('search')} />
        <select value={filters.category} onChange={update('category')}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filters.sort} onChange={update('sort')}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <p className="muted">No products found.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
      {!loading && !error && totalPages > 1 && (
        <nav className="pagination" aria-label="Product pages">
          <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </nav>
      )}
    </section>
  );
}
