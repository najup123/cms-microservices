import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { otpApi, api } from '@/lib/api'; // Using raw api for reset-password call
import { OtpInput } from '@/components/OtpInput';

export const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const navigate = useNavigate();

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await otpApi.requestOtp(email, 'PASSWORD_RESET');
            setMessage(`OTP sent to ${email}`);
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP. Email might not exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (otpValue: string) => {
        setLoading(true);
        setError('');
        try {
            const result = await otpApi.verifyOtp(email, otpValue, 'PASSWORD_RESET');
            if (result.verified) {
                setOtp(otpValue);
                setStep('reset');
                setMessage('OTP Verified. Please enter new password.');
            } else {
                setError('Invalid OTP');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/users/reset-password', {
                email,
                otp,
                newPassword
            });

            setMessage('Password reset successfully!');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            // If direct mapping failed (e.g. gateway points /api/users -> userservice),
            // and controller is at /, then /api/users/reset-password is correct.
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Back to{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign In
                        </Link>
                    </p>
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
                {message && (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">{message}</h3>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'email' && (
                    <form className="mt-8 space-y-6" onSubmit={handleRequestOtp}>
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
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Sending OTP...' : 'Send Reset Code'}
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <div className="mt-8 space-y-6">
                        <div className="text-center text-sm text-gray-600 mb-4">
                            We sent a code to <strong>{email}</strong>
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

                {step === 'reset' && (
                    <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                        <div>
                            <label htmlFor="new-password" className="sr-only">
                                New Password
                            </label>
                            <input
                                id="new-password"
                                name="newPassword"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Resetting...' : 'Set New Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
