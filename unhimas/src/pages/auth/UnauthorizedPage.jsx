import { Link } from 'react-router-dom';
import { MdLock, MdArrowBack } from 'react-icons/md';
import '../../styles/components.css';

export default function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <div>
        <MdLock style={{ fontSize: '4rem', color: 'var(--color-secondary)', marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '360px' }}>
          You do not have permission to access this page. Please contact your administrator
          if you believe this is an error.
        </p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          <MdArrowBack /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
