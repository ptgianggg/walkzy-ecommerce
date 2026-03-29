import React from 'react';
import { useSelector } from 'react-redux';
import { hasPermission, hasAnyPermission } from '../../utils/permissionUtils';
import { Tooltip, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';

/**
 * Wrapper component để disable/ẩn elements dựa trên permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Element cần wrap
 * @param {String|Array} props.permission - Mã quyền cần kiểm tra (string) hoặc array các quyền
 * @param {Boolean} props.hideIfNoPermission - Nếu true, ẩn element thay vì disable
 * @param {Boolean} props.requireAny - Nếu true và permission là array, chỉ cần một trong các quyền
 * @param {String} props.disabledTooltip - Tooltip khi button bị disable
 * @param {Object} props.buttonProps - Props truyền vào button khi disabled
 */
const PermissionWrapper = ({
  children,
  permission,
  hideIfNoPermission = false,
  requireAny = true,
  disabledTooltip = 'Bạn không có quyền thực hiện hành động này',
  buttonProps = {},
  ...restProps
}) => {
  const user = useSelector((state) => state.user);

  // Nếu không có permission yêu cầu, luôn hiển thị
  if (!permission) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (Array.isArray(permission)) {
    // Nếu là array, kiểm tra có ít nhất một quyền
    hasAccess = requireAny
      ? hasAnyPermission(user, ...permission)
      : permission.every(perm => hasPermission(user, perm));
  } else {
    // Nếu là string, kiểm tra quyền cụ thể
    hasAccess = hasPermission(user, permission);
  }

  // Nếu ẩn khi không có quyền
  if (hideIfNoPermission && !hasAccess) {
    return null;
  }

  // Nếu không có quyền, disable children
  if (!hasAccess) {
    // Nếu children là Button hoặc có thể disable
    if (React.isValidElement(children) && (children.type === Button || children.props?.disabled !== undefined)) {
      return (
        <Tooltip title={disabledTooltip}>
          {React.cloneElement(children, {
            disabled: true,
            style: {
              ...children.props?.style,
              opacity: 0.5,
              cursor: 'not-allowed',
            },
            ...buttonProps,
            ...restProps,
          })}
        </Tooltip>
      );
    }

    // Nếu không phải button, wrap trong tooltip và disable
    return (
      <Tooltip title={disabledTooltip}>
        <span style={{ opacity: 0.5, cursor: 'not-allowed', display: 'inline-block' }}>
          {children}
        </span>
      </Tooltip>
    );
  }

  // Có quyền, render bình thường
  return <>{children}</>;
};

export default PermissionWrapper;

