import { Table } from 'antd'
import React, { useState } from 'react'
import Loading from '../../components/LoadingComponent/Loading'

const TableComponent = (props) => {
  const { selectionType = 'checkbox', data: dataSource = [], isPending = false, columns = [], handleDeleteMany } = props
  const [rowSelectedKeys, setRowSelectedKeys] = useState([])
  const enableBulkDelete = typeof handleDeleteMany === 'function'

  const rowSelection = {
    onChange: (selectedRowKeys) => {
      setRowSelectedKeys(selectedRowKeys)
    }
  }

  const handleDeleteAll = () => {
    if (!enableBulkDelete) return
    handleDeleteMany(rowSelectedKeys)
  }

  return (
    <Loading isPending={isPending}>
      {enableBulkDelete && rowSelectedKeys.length > 0 && (
        <div
          style={{
            background: '#1d4ed8',
            color: '#fff',
            fontWeight: 'bold',
            padding: '10px',
            cursor: 'pointer',
            borderRadius: 8,
            marginBottom: 8
          }}
          onClick={handleDeleteAll}
        >
          Xóa tất cả đã chọn
        </div>
      )}
      <Table
        rowSelection={{ type: selectionType, ...rowSelection }}
        columns={columns}
        dataSource={dataSource}
        {...props}
      />
    </Loading>
  )
}

export default TableComponent
