// SignUpPage.jsx - GIỮ LOGIC, ĐỔI UI theo hero image + floating card
import InputForm from '../../components/InputForm/InputForm';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import { EyeFilled, EyeInvisibleFilled, ExclamationCircleOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as UserService from '../../services/UserService';
import { useMutationHooks } from '../../hooks/useMutationHook';
import Loading from '../../components/LoadingComponent/Loading';
import * as message from '../../components/Message/Message';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import PageWrapper from '../../components/PageWrapper/PageWrapper';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../redux/slides/userSlide';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateEmailRealTime,
  validatePasswordRealTime,
  getPasswordStrength
} from '../../utils/validation';

import {
  AuthFrame, BrandSide, BrandTop, BrandName, CloseButton, AuthSide, AuthSmallTitle, AuthTitle, OrRow, Muted, LinkText, FormError, MotionAuthCard
} from './style';

const authCardVariants = {
  initial: { x: 50, scale: 0.985 },
  animate: { x: 0, scale: 1, transition: { duration: 0.36, ease: 'easeOut' } },
  exit: { x: -30, scale: 0.985, transition: { duration: 0.28, ease: 'easeIn' } }
};

const SignUpPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isShowConfirmPassword, setIsShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [errors, setErrors] = useState({ email: null, password: null, confirmPassword: null });
  const [formError, setFormError] = useState(null);

  const mutation = useMutationHooks(data => UserService.signupUser(data));
  const mutationGoogle = useMutationHooks(data => UserService.loginGoogle(data));
  const { isPending } = mutation;
  const { isPending: isPendingGoogle } = mutationGoogle;



  const handleEmailChange = (value) => {
    setEmail(value);
    setFormError(null);
    setErrors(prev => ({ ...prev, email: null }));
    if (!touched.email) setTouched(prev => ({ ...prev, email: true }));
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setFormError(null);
    setErrors(prev => ({ ...prev, password: null }));
    if (!touched.password) setTouched(prev => ({ ...prev, password: true }));
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setFormError(null);
    setErrors(prev => ({ ...prev, confirmPassword: null }));
    if (!touched.confirmPassword) setTouched(prev => ({ ...prev, confirmPassword: true }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);

    setErrors({ email: emailError, password: passwordError, confirmPassword: confirmError });
    setTouched({ email: true, password: true, confirmPassword: true });

    return !emailError && !passwordError && !confirmError;
  };

  const handleSignUp = () => {
    setFormError(null);
    if (!validateForm()) return;
    mutation.mutate({ email, password });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setFormError(null);
    mutationGoogle.mutate({ token: credentialResponse.credential });
  };

  const handleGetDetailsUser = useCallback(async (id, token) => {
    const res = await UserService.getDetailsUser(id, token);
    dispatch(updateUser({ ...res?.data, access_token: token }));
  }, [dispatch]);

  useEffect(() => {
    if (mutation.isSuccess) {
      const tokenCandidate =
        mutation.data?.access_token ||
        mutation.data?.token ||
        mutation.data?.data?.access_token ||
        mutation.data?.data?.token;

      if (tokenCandidate) {
        message.success('Đăng ký thành công!');
        sessionStorage.setItem('access_token', JSON.stringify(tokenCandidate));
        const decoded = jwtDecode(tokenCandidate);
        if (decoded?.id) handleGetDetailsUser(decoded.id, tokenCandidate);
        navigate('/', { replace: true });
      } else if (mutation.data?.status === 'ERR' || mutation.data?.message) {
        const errorMsg = mutation.data?.message || 'Đăng ký thất bại!';
        setFormError(errorMsg);
        message.error(errorMsg);
      } else {
        setFormError('Đăng ký thất bại! Vui lòng thử lại.');
        message.error('Đăng ký thất bại!');
      }
    }

    if (mutation.isError) {
      let errorMsg = 'Đăng ký thất bại! Vui lòng thử lại';
      if (mutation.error?.response?.data?.message) errorMsg = mutation.error.response.data.message;
      else if (mutation.error?.message) errorMsg = mutation.error.message;

      // Giữ nguyên behavior cũ (email tồn tại)
      if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('đã tồn tại') || errorMsg.toLowerCase().includes('tồn tại')) {
        setFormError('⚠️ Email này đã được sử dụng. Vui lòng sử dụng email khác');
        setErrors(prev => ({ ...prev, email: 'Email này đã được sử dụng' }));
      } else {
        setFormError(errorMsg);
      }
      message.error(errorMsg);
    }

    if (mutationGoogle.isSuccess) {
      const tokenCandidate =
        mutationGoogle.data?.access_token ||
        mutationGoogle.data?.token ||
        mutationGoogle.data?.data?.access_token ||
        mutationGoogle.data?.data?.token;

      if (tokenCandidate) {
        message.success('Đăng nhập Google thành công!');
        sessionStorage.setItem('access_token', JSON.stringify(tokenCandidate));
        const decoded = jwtDecode(tokenCandidate);
        if (decoded?.id) handleGetDetailsUser(decoded.id, tokenCandidate);
        navigate('/', { replace: true });
      } else if (mutationGoogle.data?.status === 'ERR' || mutationGoogle.data?.message) {
        const errorMsg = mutationGoogle.data?.message || 'Đăng nhập Google thất bại!';
        setFormError(errorMsg);
        message.error(errorMsg);
      } else {
        setFormError('Đăng nhập Google thất bại!');
        message.error('Đăng nhập Google thất bại!');
      }
    }

    if (mutationGoogle.isError) {
      const errorMsg = 'Đăng nhập Google thất bại! Vui lòng thử lại';
      setFormError(errorMsg);
      message.error(errorMsg);
    }
  }, [
    mutation.isSuccess, mutation.isError, mutation.data, mutation.error,
    mutationGoogle.isSuccess, mutationGoogle.isError, mutationGoogle.data, mutationGoogle.error,
    navigate, handleGetDetailsUser
  ]);

  const passwordStrength = getPasswordStrength(password);
  const isFormValid = email && password && confirmPassword;

  return (
    <PageWrapper disableMotion>
      <AuthFrame>
        <BrandSide>
          <BrandTop>
            <BrandName>WALKZY</BrandName>
            <CloseButton aria-label="Close" onClick={() => navigate('/')}>×</CloseButton>
          </BrandTop>


        </BrandSide>

        <AuthSide>
          <MotionAuthCard
            initial="initial"
            animate="animate"
            exit="exit"
            variants={authCardVariants}
          >
            <AuthSmallTitle>THÀNH VIÊN MỚI</AuthSmallTitle>
            <AuthTitle>Tạo tài khoản</AuthTitle>

            {formError && (
              <FormError>
                <ExclamationCircleOutlined />
                {formError}
              </FormError>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InputForm
                placeholder="Email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                error={!!errors.email}
                errorText={errors.email}
                showSuccessIcon={!!email && !errors.email && touched.email}
              />

              <div style={{ position: 'relative' }}>
                <span
                  onClick={() => setIsShowPassword(!isShowPassword)}
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 12,
                    zIndex: 10,
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {isShowPassword ? <EyeFilled /> : <EyeInvisibleFilled />}
                </span>

                <InputForm
                  placeholder="Mật khẩu"
                  type={isShowPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  error={!!errors.password}
                  errorText={errors.password}
                />
              </div>

              {password && touched.password && !errors.password && (
                <Muted>
                  Độ mạnh mật khẩu: <b style={{ opacity: 0.95 }}>{passwordStrength.text}</b>
                </Muted>
              )}

              <div style={{ position: 'relative' }}>
                <span
                  onClick={() => setIsShowConfirmPassword(!isShowConfirmPassword)}
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 12,
                    zIndex: 10,
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {isShowConfirmPassword ? <EyeFilled /> : <EyeInvisibleFilled />}
                </span>

                <InputForm
                  placeholder="Nhập lại mật khẩu"
                  type={isShowConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={!!errors.confirmPassword}
                  errorText={errors.confirmPassword}
                  showSuccessIcon={!!confirmPassword && !errors.confirmPassword && touched.confirmPassword}
                />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <Loading isPending={isPending}>
                <ButtonComponent
                  variant="auth"
                  disabled={!isFormValid || isPending}
                  onClick={handleSignUp}
                  textButton="Đăng ký"
                />
              </Loading>
            </div>

            <OrRow>
              <i />
              <span>hoặc đăng ký bằng</span>
              <i />
            </OrRow>

            <Loading isPending={isPendingGoogle}>
              <div style={{ borderRadius: 999, overflow: 'hidden' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setFormError('Đăng nhập Google thất bại');
                    message.error('Đăng nhập Google thất bại');
                  }}
                  text="signup_with"
                  size="large"
                  width="100%"
                />
              </div>
            </Loading>

            <div style={{ marginTop: 16 }}>
              <Muted>
                Đã có tài khoản?{' '}
                <LinkText onClick={() => navigate('/sign-in')}>Đăng nhập</LinkText>
              </Muted>
            </div>
          </MotionAuthCard>
        </AuthSide>
      </AuthFrame>
    </PageWrapper>
  );
};

export default SignUpPage;
