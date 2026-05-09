import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerUser, clearAuthError } from '../../store/slices/authSlice';
import { fetchCourts } from '../../store/slices/courtSlice';
import { Eye, EyeOff, Lock, Mail, User, Landmark, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

// Validation schema
const schema = yup.object({
  name: yup.string().required('Full name is required').min(3, 'Name is too short'),
  email: yup.string().email('Invalid email').required('Email is required'),
  station: yup.string().required('Court station is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
}).required();

type RegisterFormInputs = yup.InferType<typeof schema>;

const Register = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();

  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDropdownOpen,      setIsDropdownOpen]      = useState(false);
  const [searchQuery,         setSearchQuery]         = useState('');

  const { loading, error } = useAppSelector((state) => state.auth);
  const { courts, loading: courtsLoading } = useAppSelector((state) => state.courts);

  // Fetch court stations on mount
  useEffect(() => {
    if (courts.length === 0) {
      dispatch(fetchCourts());
    }
  }, [dispatch, courts.length]);

  // Show error toast whenever the slice sets an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<RegisterFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { station: '' },
  });

  const selectedStation = useWatch({ control, name: 'station' });

  const filteredCourts = courts.filter((court) =>
    court.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStation = (courtName: string) => {
    setValue('station', courtName, { shouldValidate: true });
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const onSubmit = async (data: RegisterFormInputs) => {
    const result = await dispatch(registerUser({
      name:     data.name,
      email:    data.email,
      password: data.password,
      station:  data.station,
    }));

    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Please check your email to verify your account.');
      navigate('/login', { replace: true });
    }
    // error case is handled by the useEffect above
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-serif">
      <div className="w-full max-w-2xl space-y-8 p-10 bg-white shadow-xl rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Register as DR
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Succession Service Week Portal
          </p>
          <p className="mt-1 text-center text-xs text-indigo-600">
            Deputy Registrar Account
          </p>
        </div>

        <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Left Column ─────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="John Doe"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 sm:text-sm ${
                      errors.name ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
              </div>

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
                    placeholder="email@court.go.ke"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 sm:text-sm ${
                      errors.email ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              {/* Court Station */}
              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Assigned Court Station
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 z-10">
                    <Landmark size={18} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={courtsLoading}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 sm:text-sm text-left ${
                      errors.station ? 'border-red-500' : 'border-slate-300'
                    } ${courtsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className={selectedStation ? 'text-slate-900' : 'text-slate-400'}>
                      {selectedStation || (courtsLoading ? 'Loading stations…' : 'Select a court station…')}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {isDropdownOpen && !courtsLoading && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-slate-200">
                      <input
                        type="text"
                        placeholder="Search stations…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCourts.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500 text-center">
                          No stations found
                        </div>
                      ) : (
                        filteredCourts.map((court) => (
                          <button
                            key={court.id}
                            type="button"
                            onClick={() => handleSelectStation(court.name)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 transition-colors ${
                              selectedStation === court.name
                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                : 'text-slate-700'
                            }`}
                          >
                            {court.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {errors.station && (
                  <p className="mt-1 text-xs text-red-500">{errors.station.message}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  This will be the court you oversee as Deputy Registrar
                </p>
              </div>
            </div>

            {/* ── Right Column ─────────────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Password */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 sm:text-sm ${
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

              {/* Confirm Password */}
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
                    className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-900 sm:text-sm ${
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
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading || courtsLoading}
              className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:bg-slate-400 transition-all"
            >
              {loading ? 'Creating account…' : 'Register as DR'}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 hover:underline">
              Sign in here
            </Link>
          </p>
          <p className="text-center text-xs text-slate-500">
            Only Deputy Registrars can self-register. Court assistants are created by DRs.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;