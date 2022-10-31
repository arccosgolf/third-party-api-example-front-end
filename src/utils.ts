// there are libraries out there that will parse jwts for you if you'd like to use them instead.
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

// gets the authorization code from the query params
export const getAuthorizationCode = () => {
    const queryParams = new URLSearchParams(window.location.search)
    return queryParams.get('code')
}

const _filterBadParams = (params: { [k: string]: any }): { [k: string]: any } => Object.entries(params)
    .filter(([_key, value]) => ![undefined, NaN].includes(value))
    .reduce(
        (acc, [key, value]) => ({...acc, [key]: value}),
        {},
    )

// formats params properly for `x-www-form-urlencoded` request bodies. Required for the authentication endpoints
// but *not* for the standard api endpoints.
export const getUrlSearchParams = (params: { [k: string]: any }): URLSearchParams => new URLSearchParams(_filterBadParams(params))

type QueryStringifyOptions = {
    shouldEncodeUriComponent?: boolean
}
const defaultOptions: QueryStringifyOptions = {
    shouldEncodeUriComponent: true,
}

// produces the query string after the `?` (e.g. scope=whatever&something_else=true)
export const queryStringify = (params: { [k: string]: any }, options: QueryStringifyOptions = defaultOptions): string => Object.entries(_filterBadParams(params))
    .map(([key, value]) => `${key}=${options.shouldEncodeUriComponent ? encodeURIComponent(value) : value}`)
    .join('&')
