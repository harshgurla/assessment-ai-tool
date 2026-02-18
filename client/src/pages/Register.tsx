import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card, Alert } from '../components/ui';

export const Register = () => {
  const { user, register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/student" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 text-white p-3 rounded-full">
            <FileText className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          Create Student Account
        </h2>
        <p className="mt-2 text-center text-sm sm:text-base text-gray-600">
          Join the assessment platform
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && <Alert type="error" message={error} />}
            
            <Input
              label="Full Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="student@example.com"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full h-12 text-base font-medium"
            >
              Create Account
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm sm:text-base text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 active:text-blue-700">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
