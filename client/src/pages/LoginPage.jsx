import React, { useState, useContext, useRef } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { AuthContext } from '../../context/AuthContext'
import assets from '../assets/assets'
import toast from 'react-hot-toast'

const LoginPage = () => {
    const { firebaseLogin, login } = useContext(AuthContext)

    // Steps: 'landing' | 'email' | 'otp' | 'profile' | 'signin'
    const [step, setStep] = useState('landing')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [profilePic, setProfilePic] = useState('')
    const [isNewUser, setIsNewUser] = useState(false)

    // Email/password signin state
    const [signinEmail, setSigninEmail] = useState('')
    const [signinPassword, setSigninPassword] = useState('')
    const [isSignup, setIsSignup] = useState(false)
    const [signinFullName, setSigninFullName] = useState('')
    const [signinBio, setSigninBio] = useState('')

    const otpRefs = useRef([])
    const { axios } = useContext(AuthContext)

    // Handle Google OAuth
    const handleGoogleLogin = async () => {
        setLoading(true)
        try {
            const result = await signInWithPopup(auth, googleProvider)
            const firebaseToken = await result.user.getIdToken()
            const isNew = result._tokenResponse?.isNewUser
            if (isNew) {
                setFullName(result.user.displayName || '')
                setProfilePic(result.user.photoURL || '')
                window._firebaseToken = firebaseToken
                setStep('profile')
            } else {
                await firebaseLogin(firebaseToken)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault()
        console.log("Sending OTP to:", email)

        if (!email) {
            toast.error("Enter a valid email")
            return
        }
        setLoading(true)
        try {
            const { data } = await axios.post('/api/auth/send-otp', { email })
            if (data.success) {
                toast.success(`OTP sent to ${email}`)
                setStep('otp')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle OTP input change
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return
        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        // Auto focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    // Handle OTP backspace
    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    // Handle verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault()
        const otpValue = otp.join('')
        console.log("Verifying OTP:", { email, otpValue })
        if (otpValue.length !== 6) {
            toast.error("Enter complete OTP")
            return
        }
        setLoading(true)
        try {
            const { data } = await axios.post('/api/auth/verify-otp', {
                email,
                otp: otpValue
            })
            if (data.success) {
                if (data.isNewUser) {
                    // New user — go to profile setup
                    setIsNewUser(true)
                    setStep('profile')
                } else {
                    // Existing user — set token and reload
                    axios.defaults.headers.common["authorization"] = `Bearer ${data.token}`
                    localStorage.setItem("token", data.token)
                    toast.success(data.message)
                    window.location.reload()
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle profile setup completion
    const handleProfileSetup = async (e) => {
        e.preventDefault()
        if (!fullName.trim()) {
            toast.error("Please enter your name")
            return
        }
        setLoading(true)
        try {
            if (window._firebaseToken) {
                // Google OAuth new user
                await firebaseLogin(window._firebaseToken, fullName, profilePic, bio)
                delete window._firebaseToken
            } else {
                // Email OTP new user — use VERIFIED flag
                const { data } = await axios.post('/api/auth/verify-otp', {
                    email,
                    otp: 'VERIFIED',
                    fullName,
                    profilePic,
                    bio
                })
                if (data.success) {
                    axios.defaults.headers.common["authorization"] = `Bearer ${data.token}`
                    localStorage.setItem("token", data.token)
                    toast.success(data.message)
                    window.location.reload()
                } else {
                    toast.error(data.message)
                }
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle profile pic upload
    const handleProfilePicUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onloadend = () => setProfilePic(reader.result)
        reader.readAsDataURL(file)
    }

    // Handle email/password signin
    const handleEmailSignin = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(
                isSignup ? 'signup' : 'login',
                {
                    fullName: signinFullName,
                    email: signinEmail,
                    password: signinPassword,
                    bio: signinBio
                }
            )
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='min-h-screen bg-[#111b21] flex items-center justify-center p-4'>
            <div className='w-full max-w-md'>

                {/* LANDING STEP */}
                {step === 'landing' && (
                    <div className='flex flex-col items-center gap-6'>
                        <div className='flex flex-col items-center gap-3 mb-4'>
                            <img src={assets.logo_icon} alt="HumbleTree" className='w-20' />
                            <h1 className='text-white text-3xl font-light'>HumbleTree</h1>
                            <p className='text-[#8696a0] text-sm text-center'>Simple. Reliable. Private.</p>
                        </div>

                        {/* Google OAuth Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className='w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-3 px-6 rounded-lg hover:bg-gray-100 transition-all'
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            </svg>
                            {loading ? 'Connecting...' : 'Continue with Google'}
                        </button>

                        <div className='flex items-center gap-3 w-full'>
                            <hr className='flex-1 border-[#2a3942]'/>
                            <span className='text-[#8696a0] text-sm'>or</span>
                            <hr className='flex-1 border-[#2a3942]'/>
                        </div>

                        {/* Email OTP Button */}
                        <button
                            onClick={() => setStep('email')}
                            className='w-full bg-[#00a884] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#008f72] transition-all'
                        >
                            Continue with Email OTP
                        </button>

                        {/* Email/Password link */}
                        <p
                            onClick={() => setStep('signin')}
                            className='text-[#8696a0] text-sm cursor-pointer hover:text-[#00a884] transition-colors'
                        >
                            Sign in with password instead
                        </p>
                    </div>
                )}

                {/* EMAIL STEP */}
                {step === 'email' && (
                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col items-center gap-2'>
                            <img src={assets.logo_icon} alt="" className='w-14'/>
                            <h2 className='text-white text-xl font-medium'>Enter your email</h2>
                            <p className='text-[#8696a0] text-sm text-center'>
                                We'll send a verification code to your email
                            </p>
                        </div>

                        <form onSubmit={handleSendOTP} className='flex flex-col gap-4'>
                            <input
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='Email address'
                                required
                                className='bg-[#202c33] text-white border border-[#2a3942] rounded-lg px-4 py-3 outline-none focus:border-[#00a884] placeholder-[#8696a0] transition-colors'
                            />
                            <button
                                type='submit'
                                disabled={loading || !email}
                                className='w-full bg-[#00a884] text-white font-medium py-3 rounded-lg hover:bg-[#008f72] transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>

                        <p onClick={() => setStep('landing')} className='text-[#8696a0] text-sm text-center cursor-pointer hover:text-white transition-colors'>← Back</p>
                    </div>
                )}

                {/* OTP STEP */}
                {step === 'otp' && (
                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col items-center gap-2'>
                            <img src={assets.logo_icon} alt="" className='w-14'/>
                            <h2 className='text-white text-xl font-medium'>Verify your email</h2>
                            <p className='text-[#8696a0] text-sm text-center'>
                                Enter the 6-digit code sent to<br/>
                                <span className='text-white font-medium'>{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleVerifyOTP} className='flex flex-col gap-6'>
                            <div className='flex gap-3 justify-center'>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        type='text'
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className='w-12 h-12 text-center text-white text-xl font-medium bg-[#202c33] border border-[#2a3942] rounded-lg outline-none focus:border-[#00a884] transition-colors'
                                    />
                                ))}
                            </div>

                            <button
                                type='submit'
                                disabled={loading || otp.join('').length !== 6}
                                className='w-full bg-[#00a884] text-white font-medium py-3 rounded-lg hover:bg-[#008f72] transition-all disabled:opacity-50'
                            >
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                        </form>

                        <div className='flex flex-col items-center gap-2'>
                            <p className='text-[#8696a0] text-sm'>Didn't receive the code?</p>
                            <p onClick={handleSendOTP} className='text-[#00a884] text-sm cursor-pointer hover:underline'>
                                Resend OTP
                            </p>
                        </div>

                        <p onClick={() => setStep('email')} className='text-[#8696a0] text-sm text-center cursor-pointer hover:text-white'>← Back</p>
                    </div>
                )}

                {/* PROFILE SETUP STEP */}
                {step === 'profile' && (
                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col items-center gap-2'>
                            <h2 className='text-white text-xl font-medium'>Profile Info</h2>
                            <p className='text-[#8696a0] text-sm'>Provide your name and optional profile photo</p>
                        </div>

                        <form onSubmit={handleProfileSetup} className='flex flex-col gap-4'>
                            <div className='flex justify-center'>
                                <label htmlFor='profile-pic' className='cursor-pointer relative'>
                                    <div className='w-24 h-24 rounded-full bg-[#202c33] border-2 border-[#2a3942] overflow-hidden flex items-center justify-center'>
                                        {profilePic ? (
                                            <img src={profilePic} alt="" className='w-full h-full object-cover'/>
                                        ) : (
                                            <img src={assets.avatar_icon} alt="" className='w-12 opacity-50'/>
                                        )}
                                    </div>
                                    <div className='absolute bottom-0 right-0 bg-[#00a884] rounded-full p-1.5'>
                                        <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                        </svg>
                                    </div>
                                    <input id='profile-pic' type='file' accept='image/*' hidden onChange={handleProfilePicUpload}/>
                                </label>
                            </div>

                            <input
                                type='text'
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder='Your name'
                                required
                                className='bg-[#202c33] text-white border-b-2 border-[#00a884] px-2 py-3 outline-none placeholder-[#8696a0]'
                            />

                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder='About (optional)'
                                rows={3}
                                className='bg-[#202c33] text-white border-b border-[#2a3942] px-2 py-3 outline-none placeholder-[#8696a0] resize-none focus:border-[#00a884] transition-colors'
                            />

                            <button
                                type='submit'
                                disabled={loading || !fullName.trim()}
                                className='w-full bg-[#00a884] text-white font-medium py-3 rounded-lg hover:bg-[#008f72] transition-all disabled:opacity-50'
                            >
                                {loading ? 'Setting up...' : 'Get Started →'}
                            </button>
                        </form>
                    </div>
                )}

                {/* EMAIL/PASSWORD SIGNIN STEP */}
                {step === 'signin' && (
                    <div className='flex flex-col gap-6'>
                        <div className='flex flex-col items-center gap-2'>
                            <img src={assets.logo_icon} alt="" className='w-14'/>
                            <h2 className='text-white text-xl font-medium'>
                                {isSignup ? 'Create Account' : 'Welcome Back'}
                            </h2>
                        </div>

                        <form onSubmit={handleEmailSignin} className='flex flex-col gap-4'>
                            {isSignup && (
                                <>
                                    <input
                                        type='text'
                                        value={signinFullName}
                                        onChange={(e) => setSigninFullName(e.target.value)}
                                        placeholder='Full Name'
                                        required
                                        className='bg-[#202c33] text-white border border-[#2a3942] rounded-lg px-4 py-3 outline-none focus:border-[#00a884] placeholder-[#8696a0] transition-colors'
                                    />
                                    <textarea
                                        value={signinBio}
                                        onChange={(e) => setSigninBio(e.target.value)}
                                        placeholder='Short bio...'
                                        rows={2}
                                        className='bg-[#202c33] text-white border border-[#2a3942] rounded-lg px-4 py-3 outline-none focus:border-[#00a884] placeholder-[#8696a0] resize-none transition-colors'
                                    />
                                </>
                            )}
                            <input
                                type='email'
                                value={signinEmail}
                                onChange={(e) => setSigninEmail(e.target.value)}
                                placeholder='Email Address'
                                required
                                className='bg-[#202c33] text-white border border-[#2a3942] rounded-lg px-4 py-3 outline-none focus:border-[#00a884] placeholder-[#8696a0] transition-colors'
                            />
                            <input
                                type='password'
                                value={signinPassword}
                                onChange={(e) => setSigninPassword(e.target.value)}
                                placeholder='Password'
                                required
                                className='bg-[#202c33] text-white border border-[#2a3942] rounded-lg px-4 py-3 outline-none focus:border-[#00a884] placeholder-[#8696a0] transition-colors'
                            />

                            <button
                                type='submit'
                                disabled={loading}
                                className='w-full bg-[#00a884] text-white font-medium py-3 rounded-lg hover:bg-[#008f72] transition-all disabled:opacity-50'
                            >
                                {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
                            </button>
                        </form>

                        <p className='text-[#8696a0] text-sm text-center'>
                            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                            <span
                                onClick={() => setIsSignup(!isSignup)}
                                className='text-[#00a884] cursor-pointer hover:underline'
                            >
                                {isSignup ? 'Login' : 'Sign up'}
                            </span>
                        </p>

                        <p onClick={() => setStep('landing')} className='text-[#8696a0] text-sm text-center cursor-pointer hover:text-white transition-colors'>← Back</p>
                    </div>
                )}

            </div>
        </div>
    )
}

export default LoginPage