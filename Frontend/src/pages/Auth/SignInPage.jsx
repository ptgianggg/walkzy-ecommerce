// SignInPage.jsx - GIỮ LOGIC, ĐỔI UI theo hero image + floating card
import InputForm from '../../components/InputForm/InputForm';
import ButtonComponent from '../../components/ButtonComponent/ButtonComponent';
import { EyeFilled, EyeInvisibleFilled } from '@ant-design/icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as UserService from '../../services/UserService';
import { useMutationHooks } from '../../hooks/useMutationHook';
import Loading from '../../components/LoadingComponent/Loading';
import * as message from '../../components/Message/Message';
import { GoogleLogin } from '@react-oauth/google';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { jwtDecode } from "jwt-decode";
import PageWrapper from '../../components/PageWrapper/PageWrapper';
import { useDispatch, useSelector } from 'react-redux';
import { QrcodeOutlined, FormOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import { updateUser } from '../../redux/slides/userSlide';
import { clearCart, setCart } from '../../redux/slides/orderSlide';
import * as CartService from '../../services/CartService';
import { validateEmail, validatePassword, validateEmailRealTime, validatePasswordRealTime } from '../../utils/validation';

import {
  AuthFrame, BrandSide, BrandTop, BrandName, CloseButton, AuthSide, AuthSmallTitle, AuthTitle, OrRow, Muted, LinkText, FormError, MotionAuthCard
} from './style';

const authCardVariants = {
  initial: { x: 50, scale: 0.985 },
  animate: { x: 0, scale: 1, transition: { duration: 0.36, ease: 'easeOut' } },
  exit: { x: -30, scale: 0.985, transition: { duration: 0.28, ease: 'easeIn' } }
};

const SignInPage = () => {
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState('form');
  const [qrToken, setQrToken] = useState(null);

  // Validation states (GIỮ NGUYÊN)
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({ email: null, password: null });
  const [formError, setFormError] = useState(null);
  const handledLoginRef = useRef(false);
  const handledGoogleLoginRef = useRef(false);

  const navigate = useNavigate();

  const mutation = useMutationHooks(data => UserService.loginUser(data));
  const mutationGoogle = useMutationHooks(data => UserService.loginGoogle(data));
  const { isPending } = mutation;
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user);
  const order = useSelector((state) => state.order);

  const handleGetUser = useCallback(async (id, token) => {
    const res = await UserService.getDetailsUser(id, token);
    if (res?.data) {
      const newUserId = res.data._id || res.data.id;
      const currentUserId = currentUser?.id;

      if (currentUserId && currentUserId !== newUserId) {
        dispatch(clearCart());
      }

      dispatch(updateUser({ ...res?.data, access_token: token }));

      // Sync Cart
      try {
        // If switching users, do NOT sync old user's cart. Only sync if guest (currentUserId is null/undefined)
        // or if it's the same user (re-login).
        const itemsToSync = (currentUserId && currentUserId !== newUserId) ? [] : (order?.orderItems || []);

        const cartRes = await CartService.syncCart({ cartItems: itemsToSync }, token);
        if (cartRes?.status === 'OK' && cartRes?.data?.cartItems) {
          // Flatten backend structure to match frontend expectations
          const mappedItems = cartRes.data.cartItems.map(item => {
            // item.product is populated object
            const productObj = item.product || {};
            return {
              ...item,
              product: productObj._id || item.product, // ID string
              countInstock: productObj.countInStock || 0,
              availableStock: productObj.countInStock || 0, // Frontend uses both naming conventions
              name: item.name || productObj.name,
              image: item.image || productObj.image,
              price: item.price || productObj.price, // Ensure price is current
              discount: productObj.discount || 0,
              type: productObj.type,
              category: productObj.category
            };
          });
          dispatch(setCart({ cartItems: mappedItems }));
        }
      } catch (err) {
        console.error('Error syncing cart:', err);
      }
    }
  }, [dispatch, currentUser?.id, order]);



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

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({ email: emailError, password: passwordError });
    setTouched({ email: true, password: true });

    return !emailError && !passwordError;
  };

  const handleSignIn = () => {
    setFormError(null);
    handledLoginRef.current = false;

    if (!validateForm()) return;
    mutation.mutate({ email, password });
  };

  const handleGoogleSuccess = (credentialResponse) => {
    setFormError(null);
    handledGoogleLoginRef.current = false;
    mutationGoogle.mutate({ token: credentialResponse.credential });
  };

  useEffect(() => {
    if (mutation.isSuccess) {
      const tokenCandidate =
        mutation.data?.access_token ||
        mutation.data?.token ||
        mutation.data?.data?.access_token ||
        mutation.data?.data?.token;

      if (tokenCandidate) {
        message.success('Đăng nhập thành công!');
        // store token using session-aware helper (supports ?session= suffix)
        import('../../utils/sessionToken').then(mod => {
          mod.setAccessToken(tokenCandidate);
          // store refresh token per-session if returned (avoids cookie conflicts when testing multiple tabs)
          const refresh = mutation.data?.refresh_token || mutation.data?.data?.refresh_token;
          if (refresh) mod.setRefreshToken(refresh);
        }).catch(() => { });
        const decoded = jwtDecode(tokenCandidate);
        if (decoded?.id) handleGetUser(decoded.id, tokenCandidate);
        navigate('/', { replace: true });
      } else if (mutation.data?.status === 'ERR' || mutation.data?.message) {
        const errorMsg = mutation.data?.message || 'Đăng nhập thất bại!';
        setFormError(errorMsg);
        message.error(errorMsg);
      } else {
        setFormError('Đăng nhập thất bại! Vui lòng thử lại.');
        message.error('Đăng nhập thất bại!');
      }
    }

    if (mutation.isError) {
      let errorMsg = 'Đăng nhập thất bại! Vui lòng thử lại';
      if (mutation.error?.response?.data?.message) errorMsg = mutation.error.response.data.message;
      else if (mutation.error?.message) errorMsg = mutation.error.message;

      setFormError(errorMsg);
      message.error(errorMsg);
    }

    if (mutationGoogle.isSuccess && mutationGoogle.data?.status === 'OK') {
      message.success('Đăng nhập Google thành công!');
      const { access_token } = mutationGoogle.data;
      import('../../utils/sessionToken').then(mod => {
        mod.setAccessToken(access_token);
        const refresh = mutationGoogle.data?.refresh_token;
        if (refresh) mod.setRefreshToken(refresh);
      }).catch(() => { });

      if (access_token) {
        const decoded = jwtDecode(access_token);
        if (decoded?.id) handleGetUser(decoded.id, access_token);
      }

      navigate('/', { replace: true });
    }

    if (mutationGoogle.isSuccess && mutationGoogle.data?.status === 'ERR') {
      const errorMsg = mutationGoogle.data?.message || 'Đăng nhập Google thất bại!';
      setFormError(errorMsg);
      message.error(errorMsg);
    }

    if (mutationGoogle.isError) {
      const errorMsg = 'Đăng nhập Google thất bại! Vui lòng thử lại';
      setFormError(errorMsg);
      message.error(errorMsg);
    }
  }, [
    mutation.isSuccess, mutation.isError, mutation.data, mutation.error,
    mutationGoogle.isSuccess, mutationGoogle.isError, mutationGoogle.data, mutationGoogle.error,
    navigate, handleGetUser
  ]);

  useEffect(() => {
    let socket = null;
    if (loginMethod === 'qr') {
      const fetchQr = async () => {
        try {
          const res = await UserService.generateQr();
          if (res?.qrToken) {
            setQrToken(res.qrToken);
            // Assuming API URL is http://localhost:3001/api, socket is http://localhost:3001
            const socketUrl = process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') || 'http://localhost:3001';

            socket = io(socketUrl, { transports: ['websocket', 'polling'] });

            socket.on('connect', () => {
              socket.emit('join_qr_room', res.qrToken);
            });

            socket.on('login_success', (data) => {
              if (data?.token) {
                message.success('Đăng nhập bằng QR thành công!');
                const { token } = data;
                import('../../utils/sessionToken').then(mod => {
                  mod.setAccessToken(token);
                }).catch(() => { });

                const decoded = jwtDecode(token);
                if (decoded?.id) handleGetUser(decoded.id, token);
                console.log("QR Login success, navigating...");
                navigate('/', { replace: true });
              }
            });
          }
        } catch (error) {
          console.error('QR error', error);
          message.error('Không thể tạo mã QR');
        }
      };
      // Short delay to allow render
      setTimeout(fetchQr, 100);
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [loginMethod, navigate, handleGetUser]);

  const isFormValid = email && password;

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
            <AuthSmallTitle>THÀNH VIÊN</AuthSmallTitle>
            <AuthTitle>Chào mừng quay lại</AuthTitle>

            <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer' }} onClick={() => setLoginMethod(loginMethod === 'form' ? 'qr' : 'form')}>
              {loginMethod === 'form' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f53d2d', fontWeight: 600 }}>
                  <QrcodeOutlined style={{ fontSize: 32 }} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f53d2d', fontWeight: 600 }}>
                  <FormOutlined style={{ fontSize: 32 }} />
                </div>
              )}
            </div>

            {loginMethod === 'qr' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <div style={{ fontSize: 18, marginBottom: 20, fontWeight: 'bold' }}>Quét mã QR bằng App Mobile</div>
                {qrToken ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrToken}`}
                    alt="QR Login"
                    style={{ border: '1px solid #ddd', padding: 10, borderRadius: 8 }}
                  />
                ) : (
                  <Loading isPending={true} />
                )}
                <div style={{ marginTop: 20, color: '#888' }}>Mở ứng dụng Mobile &gt; Quét mã để đăng nhập</div>
              </div>
            ) : (
              <>

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
                </div>

                <div style={{ marginTop: 10, marginBottom: 18 }}>
                  <Muted>
                    <LinkText onClick={() => message.info('Bạn cần làm tính năng Quên mật khẩu ở route riêng.')}>
                      Quên mật khẩu?
                    </LinkText>
                  </Muted>
                </div>

                <Loading isPending={isPending}>
                  <ButtonComponent
                    variant="auth"
                    disabled={!isFormValid || isPending}
                    onClick={handleSignIn}
                    textButton="Đăng nhập"
                  />
                </Loading>

                <OrRow>
                  <i />
                  <span>hoặc đăng nhập bằng</span>
                  <i />
                </OrRow>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }}>
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        setFormError('Google login thất bại');
                        message.error('Google login thất bại');
                      }}
                      text="signin_with"
                      size="large"
                      width="100%"
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <Muted>
                    Bạn chưa có tài khoản?{' '}
                    <LinkText onClick={() => navigate('/sign-up')}>Đăng ký ngay</LinkText>
                  </Muted>
                </div>
              </>
            )}
          </MotionAuthCard>
        </AuthSide>
      </AuthFrame>
    </PageWrapper>
  );
};

export default SignInPage;
