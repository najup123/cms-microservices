import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { otpApi, authApi } from '@/lib/api';
import { OtpInput } from '@/components/OtpInput';
import { useAuth } from '@/contexts/AuthContext';

export const Register: React.FC = () => {
    const [step, setStep] = useState<'email' | 'otp' | 'complete'>('email');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth(); // Keeping this although not used yet, for future auto-login

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await otpApi.requestOtp(email, 'REGISTRATION');
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otpValue: string) => {
        setLoading(true);
        setError('');
        try {
            const result = await otpApi.verifyOtp(email, otpValue, 'REGISTRATION');
            if (result.verified) {
                setStep('complete');
            } else {
                setError('Invalid OTP');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await authApi.register({
                username: username,
                email: email,
                password: password,
                roles: ['ROLE_USER']
            });
            // Registration successful
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {step === 'email' && 'Create your account'}
                        {step === 'otp' && 'Verify your email'}
                        {step === 'complete' && 'Finalize Registration'}
                    </h2>
                    {step === 'email' && (
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{' '}
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                sign in to your existing account
                            </Link>
                        </p>
                    )}
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'email' && (
                    <form className="mt-8 space-y-6" onSubmit={handleRequestOtp}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">
                                    Email address
                                </label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Sending OTP...' : 'Send Verification Code'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'otp' && (
                    <div className="mt-8 space-y-6">
                        <div className="text-center text-sm text-gray-600 mb-4">
                            We sent a verification code to <strong>{email}</strong>
                        </div>
                        <OtpInput onComplete={handleVerifyOtp} />
                        {loading && <p className="text-center text-sm text-gray-500 mt-2">Verifying...</p>}
                        <div className="text-center mt-4">
                            <button
                                onClick={() => setStep('email')}
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                Change email
                            </button>
                        </div>
                    </div>
                )}

                {step === 'complete' && (
                    <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                        <div className="rounded-md bg-green-50 p-4 mb-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Email verified successfully!</h3>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="mb-4">
                                <label htmlFor="username" className="sr-only">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Create Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Registering...' : 'Complete Registration'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Register;
