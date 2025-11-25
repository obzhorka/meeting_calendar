import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

    if (formData.password.length < 6) {
      toast.error('Hasło musi mieć minimum 6 znaków');
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (result.success) {
      toast.success('Konto zostało utworzone!');
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
          <UserPlus size={48} className="auth-icon" />
          <h1>Rejestracja</h1>
          <p>Utwórz nowe konto</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username" className="label">
              <User size={18} />
              Nazwa użytkownika
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="input"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              placeholder="nazwa_uzytkownika"
            />
          </div>

          <div className="form-group">
            <label htmlFor="full_name" className="label">
              <User size={18} />
              Imię i nazwisko
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              className="input"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Jan Kowalski"
            />
          </div>

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
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Masz już konto?{' '}
            <Link to="/login" className="auth-link">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

