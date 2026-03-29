import { GoogleLogin } from '@react-oauth/google';
import { useMutationHooks } from '../../hooks/useMutationHook';
import * as UserService from '../../services/UserService';
import { useDispatch } from 'react-redux';
import { updateUser } from '../../redux/slides/userSlide';
import * as message from '../../components/Message/Message';
import { useEffect, useState, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const mutation = useMutationHooks((data) => UserService.loginGoogle(data));

  const handleSuccess = (credentialResponse) => {
    setIsLoading(true);
    if (credentialResponse.credential) {
      mutation.mutate({ token: credentialResponse.credential });
    } else {
      message.error('Không nhận được credential từ Google');
      setIsLoading(false);
    }
  };

  const handleGetUser = useCallback(async (id, token) => {
    const res = await UserService.getDetailsUser(id, token);
    dispatch(updateUser({ ...res?.data, access_token: token }));
  }, [dispatch]);

  useEffect(() => {
    if (mutation.isSuccess && mutation.data?.status === 'OK') {
      const { access_token } = mutation.data;

      // Lưu token
      sessionStorage.setItem('access_token', JSON.stringify(access_token));

      // Lấy thông tin người dùng
      if (access_token) {
        const decoded = jwtDecode(access_token);
        if (decoded?.id) {
          handleGetUser(decoded.id, access_token);
        }
      }

      // Redirect ngay lập tức vào trang chủ
      navigate('/', { replace: true });
    }

    if (mutation.isSuccess && mutation.data?.status === 'ERR') {
      message.error(mutation.data?.message || 'Đăng nhập Google thất bại!');
      setIsLoading(false);
    }

    if (mutation.isError) {
      console.error('Google login error:', mutation.error);
      message.error('Đăng nhập Google thất bại! Vui lòng thử lại');
      setIsLoading(false);
    }
  }, [mutation.isSuccess, mutation.isError, mutation.data, navigate, handleGetUser, dispatch, mutation.error]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', opacity: isLoading ? 0.7 : 1 }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          message.error('Lỗi Google OAuth');
          setIsLoading(false);
        }}
        theme="outline"
        size="large"
        width="300"
        text="continue_with"
        disabled={isLoading}
      />
    </div>
  );
};

export default GoogleLoginButton;
