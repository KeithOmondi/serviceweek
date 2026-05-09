import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { forgotPassword, clearAuthError } from '../../store/slices/authSlice';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';

// ─── Validation Schema ───────────────────────────────────────────────────────
const schema = yup.object({
  email: yup.string().email('Please enter a valid work email').required('Email is required'),
}).required();

type ForgotFormInputs = yup.InferType<typeof schema>;

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const { loading, error, message } = useAppSelector((state) => state.auth);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormInputs>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (data: ForgotFormInputs) => {
    const result = await dispatch(forgotPassword(data));
    if (forgotPassword.fulfilled.match(result)) {
      setSubmittedEmail(data.email);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-serif">
      <div className="w-full max-w-md space-y-8 p-10 bg-white shadow-xl rounded-2xl border border-slate-200">
        
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-50 mb-4">
            <Mail className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recovery</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your email to receive a password reset link for the Judiciary Portal.
          </p>
        </div>

        {message ? (
          /* Success State */
          <div className="py-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Link Sent</h3>
            <p className="mt-2 text-sm text-slate-600">
              A recovery link has been sent to <span className="font-semibold text-slate-900">{submittedEmail}</span>.
            </p>
            <p className="mt-1 text-xs text-slate-400 italic">
              Please check your spam folder if you don't see it within 5 minutes.
            </p>
            <Link
              to="/login"
              className="mt-8 w-full flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          /* Form State */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="rounded-md shadow-sm">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Work Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="name@judiciary.go.ke"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 ${
                      errors.email ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-center space-x-2 text-red-700 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 transition-all duration-200"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Send className="h-4 w-4 text-indigo-300 group-hover:text-indigo-100 transition-colors" />
                </span>
                {loading ? 'Processing...' : 'Send Recovery Link'}
              </button>
            </div>

            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Secure Login
              </Link>
            </div>
          </form>
        )}

        <div className="mt-10 border-t border-slate-100 pt-6 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-sans">
            Secured Judiciary Network
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;