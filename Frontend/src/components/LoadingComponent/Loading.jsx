import { Spin } from "antd";
import React from "react";

const Loading = ({children , isPending, delay =200}) => {
    return (
        <Spin spinning={isPending} delay={500}>
        {children}
        </Spin>
    )
}

export default Loading