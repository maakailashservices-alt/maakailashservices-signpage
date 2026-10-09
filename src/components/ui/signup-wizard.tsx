
import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  Eye,
  EyeOff,
  X,
  Lock,
  User,
  Users,
  Briefcase,
  Building2,
  CreditCard,
  Landmark,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Send,
  AtSign,
  LogIn,
  Search,
  ChevronDown,
  Mail,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, type Country, isPhoneValidForCountry } from '../../data/countries';

type AuthMode = 'signin' | 'signup' | 'forgot';
type SignupStep = 'phone' | 'otp' | 'personal' | 'instagram' | 'bank' | 'referral';
type ForgotStep = 'phone' | 'otp' | 'reset';

type FormData = {
  phone: string;
  otp: string;
  name: string;
  gmail: string;
  password: string;
  confirmPassword: string;
  instagramId: string;
  followers: string;
  contentType: string;
  customContentType: string;
  accountHolder: string;
  accountNumber: string;
  reAccountNumber: string;
  bankName: string;
  ifscCode: string;
  referralName: string;
};

const INITIAL_DATA: FormData = {
  phone: '',
  otp: '',
  name: '',
  gmail: '',
  password: '',
  confirmPassword: '',
  instagramId: '',
  followers: '',
  contentType: '',
  customContentType: '',
  accountHolder: '',
  accountNumber: '',
  reAccountNumber: '',
  bankName: '',
  ifscCode: '',
  referralName: '',
};

const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  { regex: /[!-\/:-@[-`{-~]/, text: 'At least 1 special character' },
] as const;

const CONTENT_TYPES = [
  'Fashion & Lifestyle',
  'Tech & Gadgets',
  'Food & Cooking',
  'Travel & Vlogs',
  'Education',
  'Entertainment',
  'Fitness & Health',
  'Gaming',
  'Business & Finance',
  'Other',
];

interface SignupWizardProps {
  defaultMode?: AuthMode;
}

export default function SignupWizard({ defaultMode }: SignupWizardProps) {
  const [searchParams] = useSearchParams();

  const getInitialMode = (): AuthMode => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'login' || urlMode === 'signin') return 'signin';
    if (urlMode === 'signup' || urlMode === 'register') return 'signup';
    if (defaultMode) return defaultMode;
    if (typeof window === 'undefined') return 'signup';
    const host = window.location.hostname.toLowerCase();
    if (host.includes('signin') || host.includes('login')) return 'signin';
    if (host.includes('signup') || host.includes('register')) return 'signup';
    return 'signup';
  };

  const [mode, setMode] = useState<AuthMode>(getInitialMode());
  const [signupStep, setSignupStep] = useState<SignupStep>('phone');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('phone');
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');

  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) clearInterval(interval);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const updateField = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const resetAll = () => {
    setData(INITIAL_DATA);
    setSignupStep('phone');
    setForgotStep('phone');
    setOtpSent(false);
    setOtpTimer(0);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccessMessage('');
    setCountrySearch('');
    if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
    setProfilePhoto(null);
    setProfilePhotoPreview('');
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
    setProfilePhoto(file);
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const removeProfilePhoto = () => {
    if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
    setProfilePhoto(null);
    setProfilePhotoPreview('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetAll();
    setMode(newMode);
  };

  const passwordStrength = useMemo(() => {
    const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
      met: req.regex.test(data.password),
      text: req.text,
    }));
    return {
      score: requirements.filter((req) => req.met).length,
      requirements,
    };
  }, [data.password]);

  const passwordsMatch = data.password.length > 0 && data.password === data.confirmPassword;
  const showMatchError = data.confirmPassword.length > 0 && !passwordsMatch;
  const phoneIsValid = isPhoneValidForCountry(data.phone, country);

  const sendOtp = () => {
    if (!phoneIsValid) return;
    setOtpSent(true);
    setOtpTimer(30);
    alert(`OTP sent to ${country.dialCode} ${data.phone}`);
  };

  const verifySignupOtp = () => {
    if (data.otp.length === 6) {
      setSignupStep('personal');
      setData((prev) => ({ ...prev, otp: '' }));
      setOtpSent(false);
      setOtpTimer(0);
    }
  };

  const verifyForgotOtp = () => {
    if (data.otp.length === 6) {
      setForgotStep('reset');
      setData((prev) => ({ ...prev, otp: '', password: '', confirmPassword: '' }));
      setOtpSent(false);
      setOtpTimer(0);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const canProceedPersonal =
    data.name.trim().length >= 2 &&
    passwordsMatch &&
    passwordStrength.score === 5;

  const canProceedInstagram =
    data.instagramId.trim().length > 0 &&
    data.followers.trim().length > 0 &&
    data.contentType.length > 0 &&
    (data.contentType !== 'Other' || data.customContentType.trim().length > 0);

  const canProceedBank =
    data.accountHolder.trim().length > 0 &&
    data.accountNumber.length >= 9 &&
    data.accountNumber === data.reAccountNumber &&
    data.bankName.trim().length > 0 &&
    data.ifscCode.trim().length >= 11;

  const submitSignup = () => {
    const photoInfo = profilePhoto ? ` with profile photo (${profilePhoto.name})` : '';
    setSuccessMessage(`Welcome, ${data.name}! Your account has been created successfully${photoInfo}.`);
  };

  const submitSignin = () => {
    if (phoneIsValid && data.password.length > 0) {
      setSuccessMessage(`Welcome back! You are signed in with ${country.dialCode} ${data.phone}.`);
    }
  };

  const submitForgotReset = () => {
    if (passwordsMatch && passwordStrength.score === 5) {
      setSuccessMessage('Password reset successful! You can now sign in with your new password.');
    }
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg bg-slate-800/80 border-slate-600 text-white placeholder-slate-400 outline-none focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all';

  const labelClass = 'block text-xs sm:text-sm font-medium text-slate-200 mb-1';

  const filteredCountries = useMemo(() => {
    const term = countrySearch.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.dialCode.includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [countrySearch]);

  const CountrySelector = () => (
    <div ref={countryDropdownRef} className="relative">
      <label className={labelClass}>Country</label>
      <button
        type="button"
        onClick={() => setCountryOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg bg-slate-800/80 border-slate-600 text-white hover:border-slate-500 transition-all"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{country.flag}</span>
          <span className="truncate">{country.name}</span>
          <span className="text-slate-400">({country.dialCode})</span>
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
      </button>

      {countryOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-hidden rounded-lg bg-slate-800 border border-slate-600 shadow-2xl">
          <div className="sticky top-0 bg-slate-800 p-2 border-b border-slate-600">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">No country found</div>
            ) : (
              filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCountry(c);
                    setCountryOpen(false);
                    setCountrySearch('');
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                    c.code === country.code ? 'bg-blue-600/20 text-blue-300' : 'text-white'
                  }`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-slate-400 text-xs">{c.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPasswordStrength = () => (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs sm:text-sm font-medium text-slate-300">
          {passwordStrength.score === 5 ? 'Very Strong password!!!' : 'Password strength'}
        </span>
      </div>
      <div className="flex gap-1.5 w-full justify-between mb-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            className={`h-1.5 rounded-full w-full transition-colors duration-300 ${
              passwordStrength.score >= level
                ? level === 1
                  ? 'bg-red-500'
                  : level === 2
                  ? 'bg-orange-500'
                  : level === 3
                  ? 'bg-amber-400'
                  : level === 4
                  ? 'bg-emerald-400'
                  : 'bg-emerald-500'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <ul className="space-y-1">
        {passwordStrength.requirements.map((req, index) => (
          <li key={index} className="flex items-center space-x-2">
            {req.met ? <Check size={12} className="text-emerald-400" /> : <X size={12} className="text-slate-500" />}
            <span className={`text-xs transition-colors ${req.met ? 'text-emerald-300' : 'text-slate-500'}`}>
              {req.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderSignupStepIndicator = () => {
    const steps: { key: SignupStep; label: string }[] = [
      { key: 'phone', label: 'Phone' },
      { key: 'otp', label: 'OTP' },
      { key: 'personal', label: 'Profile' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'bank', label: 'Bank' },
      { key: 'referral', label: 'Referral' },
    ];
    const currentIndex = steps.findIndex((s) => s.key === signupStep);

    return (
      <div className="flex items-center justify-between mb-5 sm:mb-6 overflow-x-auto pb-2">
        {steps.map((s, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          return (
            <div key={s.key} className="flex flex-col items-center min-w-[2.8rem]">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? <Check size={12} className="sm:w-4 sm:h-4" /> : index + 1}
              </div>
              <span
                className={`text-[9px] sm:text-xs mt-1 font-medium ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPhoneInput = (onNext: () => void, buttonText: string, showOtp: boolean) => (
    <div className="space-y-4 sm:space-y-5">
      <CountrySelector />

      <div>
        <label className={labelClass}>Phone Number</label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm sm:text-base text-slate-300 font-medium select-none">
            {country.dialCode}
          </span>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, country.phoneLength.max))}
            placeholder={`${country.phoneLength.min}-${country.phoneLength.max} digits`}
            className={`${inputClass} pl-[3.2rem] sm:pl-[3.5rem]`}
          />
        </div>
        {data.phone.length > 0 && !phoneIsValid && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <X size={12} />
            Enter {country.phoneLength.min === country.phoneLength.max
              ? `${country.phoneLength.min}`
              : `${country.phoneLength.min}-${country.phoneLength.max}`} digits for {country.name}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={sendOtp}
        disabled={!phoneIsValid}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
          phoneIsValid
            ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-900/30'
            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
        }`}
      >
        <Send size={18} /> Send OTP
      </button>

      {showOtp && otpSent && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <label className={labelClass}>Enter OTP</label>
          <div className="relative">
            <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={data.otp}
              onChange={(e) => updateField('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 digit OTP"
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between">
            {otpTimer > 0 ? (
              <span className="text-xs sm:text-sm text-slate-400">Resend OTP in {otpTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={sendOtp}
                className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Resend OTP
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={data.otp.length !== 6}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
              data.otp.length === 6
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-900/30'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {buttonText} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );

  const renderSignup = () => {
    if (successMessage) return renderSuccess(successMessage);

    switch (signupStep) {
      case 'phone':
      case 'otp':
        return (
          <>
            {renderSignupStepIndicator()}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
              Sign Up with Phone
            </h2>
            {renderPhoneInput(verifySignupOtp, 'Verify OTP', true)}
          </>
        );
      case 'personal':
        return (
          <>
            {renderSignupStepIndicator()}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
              Personal Details
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Gmail (Optional)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={data.gmail}
                    onChange={(e) => updateField('gmail', e.target.value)}
                    placeholder="you@gmail.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Create password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={data.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className={`${inputClass} ${showMatchError ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {data.confirmPassword.length > 0 && (
                  <div className="mt-1 flex items-center space-x-1.5 text-xs">
                    {passwordsMatch ? (
                      <><Check size={14} className="text-emerald-400" /><span className="text-emerald-400">Passwords match</span></>
                    ) : (
                      <><X size={14} className="text-red-400" /><span className="text-red-400">Passwords do not match</span></>
                    )}
                  </div>
                )}
              </div>

              {renderPasswordStrength()}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setSignupStep('phone'); setOtpSent(false); setData((p) => ({ ...p, otp: '' })); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setSignupStep('instagram')}
                  disabled={!canProceedPersonal}
                  className={`flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                    canProceedPersonal
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-900/30'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </>
        );
      case 'instagram':
        return (
          <>
            {renderSignupStepIndicator()}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
              Instagram Details
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col items-center mb-4">
                <label className={labelClass}>Profile Photo</label>
                <div className="relative mt-1">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center">
                    {profilePhotoPreview ? (
                      <img
                        src={profilePhotoPreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera size={32} className="text-slate-400" />
                    )}
                  </div>
                  {profilePhotoPreview && (
                    <button
                      type="button"
                      onClick={removeProfilePhoto}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <label className="mt-3 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 transition-all">
                    <Upload size={14} /> Upload Photo
                  </span>
                </label>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-400">Max 5MB (Optional)</p>
              </div>

              <div>
                <label className={labelClass}>Instagram ID</label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={data.instagramId}
                    onChange={(e) => updateField('instagramId', e.target.value)}
                    placeholder="@username"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Followers</label>
                <div className="relative">
                  <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={data.followers}
                    onChange={(e) => updateField('followers', e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 12500"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Content Type</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={data.contentType}
                    onChange={(e) => updateField('contentType', e.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="" disabled className="bg-slate-800">Select content type</option>
                    {CONTENT_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-slate-800">{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {data.contentType === 'Other' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className={labelClass}>Specify Content Type</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={data.customContentType}
                      onChange={(e) => updateField('customContentType', e.target.value)}
                      placeholder="Enter your content type"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSignupStep('personal')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setSignupStep('bank')}
                  disabled={!canProceedInstagram}
                  className={`flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                    canProceedInstagram
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-900/30'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </>
        );
      case 'bank':
        return (
          <>
            {renderSignupStepIndicator()}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
              Bank Details
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className={labelClass}>Account Holder Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={data.accountHolder}
                    onChange={(e) => updateField('accountHolder', e.target.value)}
                    placeholder="Name as per bank"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Bank Account Number</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={data.accountNumber}
                    onChange={(e) => updateField('accountNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="Account number"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Re-enter Account Number</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={data.reAccountNumber}
                    onChange={(e) => updateField('reAccountNumber', e.target.value.replace(/\D/g, ''))}
                    placeholder="Re-enter account number"
                    className={`${inputClass} ${
                      data.reAccountNumber.length > 0 && data.accountNumber !== data.reAccountNumber
                        ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
                        : ''
                    }`}
                  />
                </div>
                {data.reAccountNumber.length > 0 && data.accountNumber !== data.reAccountNumber && (
                  <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <X size={12} /> Account numbers do not match
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <div className="relative">
                    <Landmark size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={data.bankName}
                      onChange={(e) => updateField('bankName', e.target.value)}
                      placeholder="Bank name"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>IFSC Code</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={data.ifscCode}
                      onChange={(e) => updateField('ifscCode', e.target.value.toUpperCase())}
                      placeholder="SBIN0001234"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSignupStep('instagram')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setSignupStep('referral')}
                  disabled={!canProceedBank}
                  className={`flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                    canProceedBank
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-900/30'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </>
        );
      case 'referral':
        return (
          <>
            {renderSignupStepIndicator()}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
              Referral
            </h2>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className={labelClass}>Referral Name (Optional)</label>
                <div className="relative">
                  <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={data.referralName}
                    onChange={(e) => updateField('referralName', e.target.value)}
                    placeholder="Who referred you?"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSignupStep('bank')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={submitSignup}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-900/30 transition-all"
                >
                  Complete <Check size={18} />
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  const renderSignin = () => {
    if (successMessage) return renderSuccess(successMessage);

    return (
      <>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
          Sign In
        </h2>
        <div className="space-y-4 sm:space-y-5">
          <CountrySelector />

          <div>
            <label className={labelClass}>Phone Number</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm sm:text-base text-slate-300 font-medium select-none">
                {country.dialCode}
              </span>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, country.phoneLength.max))}
                placeholder={`${country.phoneLength.min}-${country.phoneLength.max} digits`}
                className={`${inputClass} pl-[3.2rem] sm:pl-[3.5rem]`}
              />
            </div>
            {data.phone.length > 0 && !phoneIsValid && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <X size={12} />
                Enter {country.phoneLength.min === country.phoneLength.max
                  ? `${country.phoneLength.min}`
                  : `${country.phoneLength.min}-${country.phoneLength.max}`} digits for {country.name}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Enter your password"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="button"
            onClick={submitSignin}
            disabled={!phoneIsValid || data.password.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
              phoneIsValid && data.password.length > 0
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400 shadow-lg shadow-blue-900/30'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <LogIn size={18} /> Sign In
          </button>
        </div>
      </>
    );
  };

  const renderForgot = () => {
    if (successMessage) return renderSuccess(successMessage);

    switch (forgotStep) {
      case 'phone':
      case 'otp':
        return (
          <>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
              Reset Password
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 text-center mb-4">
              Enter your phone number. We will send an OTP to reset your password.
            </p>
            {renderPhoneInput(verifyForgotOtp, 'Verify OTP', true)}
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="mt-4 w-full text-center text-xs sm:text-sm text-slate-400 hover:text-white transition-colors"
            >
              Remember password? Sign In
            </button>
          </>
        );
      case 'reset':
        return (
          <>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 text-center text-white">
              Create New Password
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className={labelClass}>New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={data.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Create new password"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={data.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Re-enter new password"
                    className={`${inputClass} ${showMatchError ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {data.confirmPassword.length > 0 && (
                  <div className="mt-1 flex items-center space-x-1.5 text-xs">
                    {passwordsMatch ? (
                      <><Check size={14} className="text-emerald-400" /><span className="text-emerald-400">Passwords match</span></>
                    ) : (
                      <><X size={14} className="text-red-400" /><span className="text-red-400">Passwords do not match</span></>
                    )}
                  </div>
                )}
              </div>

              {renderPasswordStrength()}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setForgotStep('phone'); setOtpSent(false); setData((p) => ({ ...p, otp: '' })); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold bg-slate-700 text-white hover:bg-slate-600 transition-all"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={submitForgotReset}
                  disabled={!passwordsMatch || passwordStrength.score !== 5}
                  className={`flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${
                    passwordsMatch && passwordStrength.score === 5
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Reset Password <Check size={18} />
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  const renderSuccess = (message: string) => (
    <div className="text-center py-6 sm:py-8 space-y-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Check size={40} className="text-emerald-400" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-white">Success!</h3>
      <p className="text-sm sm:text-base text-slate-300 px-2">{message}</p>
      <button
        type="button"
        onClick={() => switchMode('signin')}
        className="mt-4 px-6 py-2.5 rounded-lg text-sm sm:text-base font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all"
      >
        Go to Sign In
      </button>
    </div>
  );

  return (
    <div className="w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto p-5 sm:p-7 md:p-8 rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
      <div className="flex justify-center mb-5 sm:mb-6">
        <div className="inline-flex p-1 rounded-full bg-slate-800/80 border border-slate-700/60">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
              mode === 'signin' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`px-4 sm:px-6 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all ${
              mode === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {mode === 'signup' && renderSignup()}
      {mode === 'signin' && renderSignin()}
      {mode === 'forgot' && renderForgot()}

      {mode !== 'forgot' && !successMessage && (
        <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-slate-400">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      )}
    </div>
  );
}
