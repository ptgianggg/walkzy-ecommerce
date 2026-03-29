import { WrapperContent, WrapperLabelText, WrapperTextPrice, WrapperTextValue } from './style'
import { Checkbox, Rate } from 'antd'


const NavbarComponent = () => {
    const onChange = () => { }
    const renderContent = (type, options) => {
        switch (type) {
            case `text`:
                return options.map((option) => {

                    return (

                        <WrapperTextValue>{option}</WrapperTextValue>

                    )

                })
            case 'checkbox':
                return (
                    <Checkbox.Group style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }} onChange={onChange}>
                        {options.map((option) => {
                            return (
                                <Checkbox style={{ marginLeft: 0 }} value={option.value} >{option.label}</Checkbox>
                            )
                        })}
                        <Checkbox value="B">B</Checkbox>
                    </Checkbox.Group>
                )
            case 'star':
                return options.map((option) => {

                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Rate style={{ fontSize: '13px' }} disabled defaultValue={option} />
                            <span style={{ fontSize: '13px' }}>{`Tu ${option}  sao`}</span>
                        </div>
                    )
                })
            case 'price':
                return options.map((option) => {

                    return (
                        <WrapperTextPrice>{option}</WrapperTextPrice>
                    )
                })

            default:
                return {}
        }
    }
    return (
        <div >
            <WrapperLabelText>  Label </WrapperLabelText>
            <WrapperContent>
                {renderContent('text', ['Quần', 'Áo', 'Mắt kính'])}
            </WrapperContent>

        </div>

    )
}

export default NavbarComponent