export const parseJwt = (token: string) => {
    const base64Url = token.split('.')[1]
    const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
        window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    )

    return JSON.parse(jsonPayload)
}

export const getAccessCode = () => {
    const queryParams = new URLSearchParams(window.location.search)
    return queryParams.get('code')
}

export const formatRequestBodyForAuth = (params: any): URLSearchParams => new URLSearchParams(
    Object.entries(params)
        .filter(([_key, value]) => !!value)
        .reduce(
            (acc, [key, value]) => ({...acc, [key]: value}),
            {},
        ),
)