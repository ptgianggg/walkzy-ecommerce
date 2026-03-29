import { Image } from 'antd';
import React from 'react'
import { WrapperSliderStyle, WrapperSlierStyle } from './style';

const SliderComponent = ({arrImages} ) => {
   const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay :true,
        autoplaySpeed: 1000 // ảnh tự động
  };
    return (
     <WrapperSliderStyle {...settings}>
    {arrImages.map((image) => (
      //<div key={index}>
        <Image key={image} src={image} alt="slider" preview={false} width="100%" height="274px" />
      //</div>
    ))}
  </WrapperSliderStyle>
  )
}

export default SliderComponent