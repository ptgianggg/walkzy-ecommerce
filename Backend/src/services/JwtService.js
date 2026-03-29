const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const generalAccesstoken = async (payload) => {
    const access_token = jwt.sign({
        ...payload
    }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
    return access_token;
}


const generalRefreshtoken = async (payload) => {
    const refresh_token = jwt.sign({
        ...payload
    }, process.env.REFRESH_TOKEN, { expiresIn: '365d' });
    return refresh_token;
}

const refreshTokenJwtService =  (token) => {
     return new Promise((resolve, reject) => {
        try {
                console.log('token',token)
                jwt.verify(token, process.env.REFRESH_TOKEN,async (err, user) => {
                    if(err){
                        console.log('err',err);
                        resolve({
                            status: 'ERR',
                            message: 'The authemtication'
                        })
                    }
                const access_token = await generalAccesstoken ({
                    id: user?.id,
                    isAdmin: user?.isAdmin

                })
                console.log('access_token',access_token)
                  resolve({
                    status: 'OK',
                    message: 'SUCCESS',    
                    access_token
                    
                })
                   
                })
               
              

        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    generalAccesstoken,
    generalRefreshtoken,
    refreshTokenJwtService
}