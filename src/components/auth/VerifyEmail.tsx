import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { verifyEmail } from '../../store/slices/authSlice';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();

  // Use a module-level flag so StrictMode double-mount doesn't re-fire
  const didVerify = useRef(false);

  const [localStatus, setLocalStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [localError, setLocalError]   = useState<string | null>(null);

  useEffect(() => {
    if (!token || didVerify.current) return;
    didVerify.current = true;

    dispatch(verifyEmail(token)).then((result) => {
      if (verifyEmail.fulfilled.match(result)) {
        setLocalStatus('success');
      } else {
        setLocalError(
          (result.payload as string) ?? 'The verification link is invalid or has expired.'
        );
        setLocalStatus('error');
      }
    });
  }, [token, dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-serif">
      <div className="w-full max-w-md space-y-8 p-10 bg-white shadow-xl rounded-2xl border border-slate-200 text-center">

        {/* Branding */}
        <div className="mb-8">
          <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase">
            Office of the Registrar — High Court
          </h2>
          <div className="h-1 w-12 bg-amber-500 mx-auto mt-2" />
        </div>

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {localStatus === 'loading' && (
          <div className="py-12">
            <Loader2 className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
            <h3 className="mt-4 text-xl font-semibold text-slate-900">Verifying Account</h3>
            <p className="mt-2 text-slate-500 text-sm">
              Please wait while we validate your credentials with the High Court Registry…
            </p>
          </div>
        )}

        {/* ── Success ───────────────────────────────────────────────────── */}
        {localStatus === 'success' && (
          <div className="py-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Email Verified</h3>
            <p className="mt-3 text-slate-600">
              Your account for the{' '}
              <span className="font-semibold text-slate-900">Succession Service Week Portal</span>{' '}
              has been successfully activated.
            </p>
            <div className="mt-8">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Proceed to Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {localStatus === 'error' && (
          <div className="py-8">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Verification Failed</h3>
            <p className="mt-3 text-slate-600 text-sm">
              {localError ?? 'The verification link is invalid or has expired. Please contact your Deputy Registrar.'}
            </p>
            <div className="mt-8">
              <Link
                to="/login"
                className="block w-full py-3 px-4 rounded-lg text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}

        <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-10">
          High Court of Kenya © 2026 Succession Service Week
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;