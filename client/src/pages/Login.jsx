import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { LogIn, Mail, Lock } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success('Zalogowano pomyślnie!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <LogIn size={48} className="auth-icon" />
          <h1>Logowanie</h1>
          <p>Zaloguj się do swojego konta</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="label">
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="twoj@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              <Lock size={18} />
              Hasło
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Nie masz konta?{' '}
            <Link to="/register" className="auth-link">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

