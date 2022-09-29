import React, {useEffect, useState} from "react";

const ID_PROVIDER_URL = 'https://iqa-cf-arccosgolf.auth.us-west-2.amazoncognito.com'
const CLIENT_ID = '37h1u107181rgvcdcd0gjk5619'
const CLIENT_SECRET = 'jgps5k64p9811itseka6n5pnjveaa3bf1gn2c7a08sk8dcdfve0'
const REDIRECT_URI = 'http://localhost:8080'
const RESPONSE_TYPE = 'code'
const SCOPES = [
    'openid',
    'profile',
    'arccos/read:rounds',
]

type TokenResponse = {
    access_token: string
    id_token?: string
    refresh_token?: string
}

export const App: React.FC = () => {
    const [tokenResponse, setTokenResponse] = useState<TokenResponse>()
    const [isFetchingAccessToken, setIsFetchingAccessToken] = useState<boolean>()
    const queryParams = new URLSearchParams(window.location.search)
    const accessCode = queryParams.get('code')

    useEffect(() => {
        if (accessCode && !isFetchingAccessToken) {
            window.fetch(
                `https://iqa-cf-arccosgolf.auth.us-west-2.amazoncognito.com/oauth2/token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        client_id: CLIENT_ID,
                        code: accessCode,
                        redirect_uri: REDIRECT_URI,
                        client_secret: CLIENT_SECRET,
                    })
                }
            )
                .then(res => res.json())
                .then(body => setTokenResponse(body))
        }
    }, [])
    const signInUrl = `${ID_PROVIDER_URL}/login?client_id=${CLIENT_ID}&redirect_uri=${encodeURI(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join('+')}`
    return (
        <div>
            <div>
                <h3>Authentication Information</h3>
                <div>
                    <label>Access Code: </label>
                    <span>{accessCode}</span>
                </div>
                <div>
                    <label>Token Response: </label>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{tokenResponse ? JSON.stringify(tokenResponse, null, 4) : 'undefined'}</div>
                </div>
            </div>
            <a href={signInUrl}>Click Here to Sign In</a>
        </div>
    )
}
