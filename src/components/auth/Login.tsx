import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const schema = yup.object({
  email:    yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
}).required();

type LoginFormInputs = yup.InferType<typeof schema>;

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);

  const { loading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const from = location.state?.from?.pathname;

  // Clear any stale error/message left over from verify-email or other flows
  useEffect(() => {
    dispatch(clearAuthError());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect once authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const rolePaths: Record<string, string> = {
        admin:           '/admin/dashboard',
        dr:              '/dr/dashboard',
        court_assistant: '/c/dashboard',
      };
      navigate(from ?? rolePaths[user.role] ?? '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: LoginFormInputs) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-serif">
      <div className="w-full max-w-md space-y-8 p-10 bg-white shadow-xl rounded-2xl border border-slate-200">

        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">Sign In</h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Succession Service Week Portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  {...register('email')}
                  type="email"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 sm:text-sm ${
                    errors.email ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="name@court.go.ke"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:underline mb-1"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 sm:text-sm ${
                    errors.password ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Error banner — only shown after a real login attempt */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 transition-all"
            >
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>

            <p className="text-center text-sm text-slate-600">
              Need an account?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            High Court of Kenya © 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;