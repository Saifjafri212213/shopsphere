import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const outOfStock = product.stock === 0;
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timeout = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(timeout);
  }, [showToast]);

  const handleAdd = () => {
    addToCart(product);
    setShowToast(true);
  };

  return (
    <article className="card product-card">
      <Link to={`/product/${product._id}`}>
        <img src={product.image} alt={product.name} />
      </Link>
      <div className="card-body">
        <span className="tag">{product.category}</span>
        <Link to={`/product/${product._id}`} className="product-name">{product.name}</Link>
        <div className="row-between">
          <strong>{formatINR(product.price)}</strong>
          <span className="muted">★ {product.rating.toFixed(1)}</span>
        </div>
        <button className="btn full" disabled={outOfStock} onClick={handleAdd}>
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
        {showToast && <p className="cart-toast" role="status">{product.name} added to cart</p>}
      </div>
    </article>
  );
}
