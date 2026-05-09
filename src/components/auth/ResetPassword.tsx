import { useEffect, useState } from 'react'; // Added useState
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetPassword, clearAuthError } from '../../store/slices/authSlice';
import { 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react'; // Added Eye icons

const schema = yup.object({
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your new password'),
}).required();

type ResetFormInputs = yup.InferType<typeof schema>;

const ResetPassword = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  // State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { loading, error, message } = useAppSelector((state) => state.auth);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetFormInputs>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: ResetFormInputs) => {
    if (!token) return;
    const result = await dispatch(resetPassword({ token, password: data.password }));
    if (resetPassword.fulfilled.match(result)) {
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md border border-red-100 text-center max-w-md">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Invalid Reset Link</h2>
          <p className="text-slate-600 mt-2">
            The password reset token is missing. Please request a new link from the login page.
          </p>
          <Link to="/login" className="mt-6 inline-block text-indigo-600 font-semibold hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-serif">
      <div className="w-full max-w-md space-y-8 p-10 bg-white shadow-xl rounded-2xl border border-slate-200">

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 mb-4">
            <ShieldCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Set New Password</h2>
          <p className="mt-2 text-sm text-slate-500 italic">
            High Court Succession Service Week Portal
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-bold">Success!</p>
              <p className="text-sm">{message} Redirecting to login...</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 ${
                    errors.password ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-center space-x-2 text-red-700 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !!message}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 transition-all duration-200"
          >
            {loading ? 'Updating Password...' : 'Set Password'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            Back to Secure Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;